---
id: calm-hub-decorator-views
title: Decorator Views
sidebar_label: Decorator Views
sidebar_position: 5
---

# Decorator Views

A decorator view tells the Hub UI how to draw one kind of [decorator](../core-concepts/decorators.md)
on the diagram: a badge on each node and relationship, and a row in the legend. A view has no
route and no backend. A team that writes decorators can thus show them in Hub with only a
manifest.

## Write a view

```json
{
  "id": "release-risk",
  "match": { "type": "release-risk" },
  "label": "Release risk",
  "overlay": {
    "status": "/risk",
    "map": { "low": "ok", "medium": "warn", "high": "error" },
    "default": "info",
    "label": "/summary"
  }
}
```

| Field | Required | Rule |
|---|---|---|
| `id` | Yes | Lower case letters, digits and `-`, starting with a letter (`^[a-z][a-z0-9-]*$`). Unique in all enabled extensions. CALM Hub does not start with a duplicate |
| `match` | Yes | Exactly one of `type` (the decorator `type`) or `schema` (the decorator `$schema` URL) |
| `label` | Yes | The name in the legend |
| `overlay.status` | Yes | A JSON Pointer into the decorator `data`. The value must be a string |
| `overlay.map` | Yes | Maps each status value to `ok`, `warn`, `error` or `info` |
| `overlay.default` | No | The status for a value that `map` does not name. With no `default`, Hub does not draw that decorator |
| `overlay.label` | No | A JSON Pointer to a short text that the badge details show |
| `overlay.hide` | No | Status values that draw nothing, but still count as the newest result. Use it to clear an older result |
| `overlay.time` | No | A JSON Pointer to an ISO date-time. With it, only the newest decorator counts for each element |
| `overlay.key` | No | A JSON Pointer. With `time`, only the newest decorator of each key counts, for example one result for each control |
| `overlay.items` | No | A JSON Pointer to an array in `data`. Each element of the array is one result: `status` and `label` then point into the element. Needs `applies-to`. With `time`, Hub first picks the newest decorator of each `key`, then draws only its items |
| `overlay.applies-to` | With `items` | A JSON Pointer, into each element of `items`, to the list of node and relationship ids that the result is for |

The pointers read fields in `data`. For example, `/risk` reads `data.risk`, and
`/control/unique-id` reads `data.control["unique-id"]`. Thus `overlay.time` cannot read the
Hub-owned `creationDateTime` or `updateDateTime`: put the time of the result in `data`.

A view without `overlay` is valid, but the UI draws nothing for it yet.

## How Hub draws a view

- Each decorator counts for the elements in its `applies-to`, on the architecture version in its
  `target`.
- With `items`, each element of the array counts for the ids in its own `applies-to` that the
  decorator `applies-to` also names. Thus one decorator can give each element a different status,
  and the details drawer lists the decorator for each element that has a badge.
- With `items` and `time`, Hub picks the newest decorator of each `key` across all the decorators
  first, and only then draws its items. An element that the newest decorator no longer names shows
  no badge, not the items of an older one. Two decorators with the same time go to the greater
  `unique-id`, then the later one in the list.
- Hub skips a decorator that it cannot draw: the status is not a string, the value is not mapped
  and there is no `default`, or the `key` or `time` is missing or not valid. Thus a bad decorator
  never hides an older good result.
- An element shows its worst status: `error`, then `warn`, `info` and `ok`. The badge text is the
  raw value, for example `not-met` shows as "Not met". `error` also colours the element red, and
  `warn` amber.
- A container shows the results of its `deployed-in` and `composed-of` relationships.
- Click a badge to see each result, its mapped status, its label and its time.
- While the diagram, the **Decorators** tab or the details drawer is open, Hub reads the decorators again every 5 seconds. The other tabs do not. The overlays, the **Decorators** tab and the details drawer show the same list. The details drawer lists all the decorators of the element under **All decorators**, also the older ones that a badge does not count.
- If the browser cannot load the extension registry, Hub draws only the built-in views. Only the registry tells the browser that an operator turned a built-in view off, so Hub then draws all of them, also one set to `enabled=false`. The **Decorators** tab still shows the stored data. Hub tries the registry again, and draws the extension views when it loads.

## Built-in views

CALM Hub ships three views. They are in the extension registry as the extensions `control-evaluation`,
`deployment` and `threat-model`, and the legend calls them `Built-in`.

| View | Decorator type | Status (`data.status`) | Newest by |
|---|---|---|---|
| `control-evaluation` | `control-evaluation` | `met` → `ok`, `not-met` → `error`. `not-applicable` is hidden. Other values are not drawn | `data.evaluated-at`, for each `data.control.unique-id` |
| `deployment` | `deployment` | `completed` → `ok`, `in-progress` and `pending` → `info`, `rolled-back` → `warn`, `failed` → `error`. Other values → `info` | `data.start-time` |
| `threat-model` | `threat-model` | Each threat in `data.threats`, by its `status`: `identified` → `error`, `partially-mitigated` → `warn`, `mitigated` → `ok`, `accepted` and `transferred` → `info`. `not-applicable` is hidden | `data.assessed-on`, for each `data.flow` |

The `control-evaluation` view labels each badge with `data.control.unique-id`. The control
evaluation overlay also has its own panel and decision callouts, see
[Control Evaluations](../working-with-calm/calm-hub.md#control-evaluations). The `threat-model` view
labels each badge with the threat `name`. `assessed-on` is a date, so two assessments of a flow on the
same day go to the greater `unique-id`. The view also has its own panel, see
[Threat Models](../working-with-calm/calm-hub.md#threat-models). To turn a built-in view off, set
`calm.extensions."deployment".enabled=false`, or the same for another built-in id.

## Show your decorators without a backend

1. Write decorators with your own service account, as in
   [Show your decorators in Hub](index.md#show-your-decorators-in-hub). Use a stable `type`, and put
   the status in `data`. Do not send `creationDateTime` or `updateDateTime`: Hub sets them, and
   refuses a decorator that has them with `400` (see
   [Decorator write rules](mcp-and-api.md#decorator-write-rules)).
2. Put a manifest with only `decorator-views` at `<calm.extensions.dir>/<id>/extension.json`:

   ```json
   {
     "id": "scanner",
     "version": "1.0.0",
     "hubApi": 0,
     "name": "Security scan",
     "contributes": {
       "decorator-views": [{
         "id": "security-scan",
         "match": { "type": "security-scan" },
         "label": "Security scan",
         "overlay": { "status": "/result", "map": { "safe": "ok", "unsafe": "error" }, "default": "info" }
       }]
     }
   }
   ```

3. Restart CALM Hub. A manifest with no routes needs no `backend-url`, no identity keys and no
   `allow-without-auth`.

The legend row reads `Security scan · Security scan` (the view label, then the extension name).
Each extension gets a colour marker, derived from its id, on its badges and legend rows. The legend
switches each view, and all the views of one extension, on or off. When the browser has no stored
choice, the built-in views and the first three extension views in registry order are on. The order
does not depend on the diagram. Set `calm.extensions."scanner".order=-1` to move a view up the list.
