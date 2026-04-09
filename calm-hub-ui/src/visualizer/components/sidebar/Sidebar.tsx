import { useState } from 'react';
import { IoCloseOutline, IoCubeOutline, IoGitNetworkOutline, IoShieldCheckmarkOutline, IoEyeOutline, IoCodeOutline } from 'react-icons/io5';
import { CalmNodeSchema, CalmRelationshipSchema } from '@finos/calm-models/types';
import { JsonRenderer } from '../../../hub/components/json-renderer/JsonRenderer.js';
import { NodeDetails } from './NodeDetails.js';
import { RelationshipDetails } from './RelationshipDetails.js';
import { ThreatDetail } from '../reactflow/threat-panel/ThreatDetail.js';
import type { SidebarProps, SelectedItem } from '../../contracts/visualizer-contracts.js';

function isThreatItem(item: NonNullable<SelectedItem>): item is { threat: import('../../contracts/decorator-contracts.js').Threat; recommendations?: import('../../contracts/decorator-contracts.js').Recommendation[] } {
    return 'threat' in item;
}

function isDataItem(item: NonNullable<SelectedItem>): item is { data: CalmNodeSchema | CalmRelationshipSchema } {
    return 'data' in item;
}

function isCALMNode(data: CalmNodeSchema | CalmRelationshipSchema): data is CalmNodeSchema {
    return 'node-type' in data;
}

function isCALMRelationship(data: CalmNodeSchema | CalmRelationshipSchema): data is CalmRelationshipSchema {
    return 'relationship-type' in data;
}

export function Sidebar({ selectedItem, closeSidebar }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'json'>('details');

    const isThreat = isThreatItem(selectedItem);
    const selectedData = isDataItem(selectedItem) ? selectedItem.data : null;
    const isNode = selectedData ? isCALMNode(selectedData) : false;
    const isRelationship = selectedData ? isCALMRelationship(selectedData) : false;

    const title = isThreat ? 'Threat' : isNode ? 'Node' : isRelationship ? 'Relationship' : 'Details';
    const TitleIcon = isThreat ? IoShieldCheckmarkOutline : isNode ? IoCubeOutline : isRelationship ? IoGitNetworkOutline : null;

    return (
        <div className="p-4 pl-2 h-full w-96 shrink-0">
            <div className="h-full bg-base-100 rounded-box shadow-xl flex flex-col overflow-hidden">
                <div className="bg-base-200 px-6 py-4 border-b border-base-300 flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        {TitleIcon && <TitleIcon className="text-accent" />}
                        {title}
                    </h2>
                    <div className="flex items-center gap-1">
                        {!isThreat && (
                            <div className="inline-flex rounded-lg bg-base-300 p-0.5">
                                <button
                                    role="tab"
                                    aria-label="Details"
                                    onClick={() => setActiveTab('details')}
                                    className={`p-1.5 rounded-md transition-colors ${activeTab === 'details' ? 'bg-accent text-white' : 'text-base-content/50 hover:text-base-content'}`}
                                >
                                    <IoEyeOutline size={14} />
                                </button>
                                <button
                                    role="tab"
                                    aria-label="JSON"
                                    onClick={() => setActiveTab('json')}
                                    className={`p-1.5 rounded-md transition-colors ${activeTab === 'json' ? 'bg-accent text-white' : 'text-base-content/50 hover:text-base-content'}`}
                                >
                                    <IoCodeOutline size={14} />
                                </button>
                            </div>
                        )}
                        <button
                            aria-label="close-sidebar"
                            onClick={(e) => {
                                e.stopPropagation();
                                closeSidebar();
                            }}
                            className="btn btn-ghost btn-xs btn-circle"
                        >
                            <IoCloseOutline size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {isThreat ? (
                        <div className="h-full overflow-auto">
                            <ThreatDetail threat={selectedItem.threat} recommendations={selectedItem.recommendations} />
                        </div>
                    ) : activeTab === 'details' ? (
                        selectedData && (isNode || isRelationship) ? (
                            <div className="h-full overflow-auto">
                                {isNode ? (
                                    <NodeDetails data={selectedData as CalmNodeSchema} />
                                ) : (
                                    <RelationshipDetails data={selectedData as CalmRelationshipSchema} />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-base-content/60">
                                <p>Unknown Selected Entity</p>
                            </div>
                        )
                    ) : (
                        <div className="h-full bg-base-200 overflow-auto">
                            <JsonRenderer json={selectedData ?? {}} showLineNumbers={false} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
