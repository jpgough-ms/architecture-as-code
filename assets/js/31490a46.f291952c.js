"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[429],{8787:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>a,metadata:()=>r,toc:()=>d});var i=t(4848),s=t(8453);const a={id:"what-is-calm",title:"What is CALM?",sidebar_position:2},o="What is CALM?",r={id:"introduction/what-is-calm",title:"What is CALM?",description:"The Common Architecture Language Model (CALM) is an open-source specification developed by the Architecture as Code (AasC) community under FINOS. CALM provides a standardized, machine-readable, and human-readable format for defining software architectures. By capturing architecture as code, CALM enables a consistent, version-controlled approach that aligns design intent with implementation, fostering better collaboration and automation in software development.",source:"@site/docs/introduction/what-is-calm.md",sourceDirName:"introduction",slug:"/introduction/what-is-calm",permalink:"/architecture-as-code/introduction/what-is-calm",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{id:"what-is-calm",title:"What is CALM?",sidebar_position:2},sidebar:"docsSidebar",previous:{title:"Introduction",permalink:"/architecture-as-code/introduction/"},next:{title:"Why Use CALM?",permalink:"/architecture-as-code/introduction/why-use-calm"}},c={},d=[{value:"The Purpose of CALM",id:"the-purpose-of-calm",level:2},{value:"How CALM Works",id:"how-calm-works",level:2},{value:"1. <strong>Nodes</strong>",id:"1-nodes",level:3},{value:"2. <strong>Relationships</strong>",id:"2-relationships",level:3},{value:"3. <strong>Metadata</strong>",id:"3-metadata",level:3},{value:"CALM Schema: A JSON Meta Schema",id:"calm-schema-a-json-meta-schema",level:2},{value:"Benefits of CALM",id:"benefits-of-calm",level:2},{value:"Getting Started with CALM",id:"getting-started-with-calm",level:2}];function l(e){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"what-is-calm",children:"What is CALM?"})}),"\n",(0,i.jsx)(n.p,{children:"The Common Architecture Language Model (CALM) is an open-source specification developed by the Architecture as Code (AasC) community under FINOS. CALM provides a standardized, machine-readable, and human-readable format for defining software architectures. By capturing architecture as code, CALM enables a consistent, version-controlled approach that aligns design intent with implementation, fostering better collaboration and automation in software development."}),"\n",(0,i.jsx)(n.h2,{id:"the-purpose-of-calm",children:"The Purpose of CALM"}),"\n",(0,i.jsx)(n.p,{children:"CALM was created to address the challenges that arise when software architecture is disconnected from the actual implementation. Traditional approaches often rely on static diagrams, informal notations, or ad hoc documentation, leading to inconsistencies and a lack of traceability. CALM aims to:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Standardize Architecture Descriptions"}),": Provide a common language that architects, developers, and tools can use to describe system architectures consistently."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Enable Automation"}),": Support automated validation, visualization, and compliance checks, integrating architecture into CI/CD workflows."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Foster Collaboration"}),": Create a shared understanding of system designs across teams and stakeholders, reducing miscommunication and errors."]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"how-calm-works",children:"How CALM Works"}),"\n",(0,i.jsx)(n.p,{children:"CALM structures architecture into three primary components: nodes, relationships, and metadata. This modular approach allows architects to model complex systems flexibly, supporting both high-level overviews and detailed, drill-down architecture."}),"\n",(0,i.jsxs)(n.h3,{id:"1-nodes",children:["1. ",(0,i.jsx)(n.strong,{children:"Nodes"})]}),"\n",(0,i.jsx)(n.p,{children:'Nodes represent the individual elements of your architecture, such as services, databases, networks, and people. They are the "building blocks" of your system and can be used to model components at various levels of abstraction.'}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Examples of Nodes"}),": A microservice, a database, a front-end application, or even a person interacting with the system."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Properties"}),": Nodes have key properties such as ",(0,i.jsx)(n.code,{children:"unique-id"}),", ",(0,i.jsx)(n.code,{children:"node-type"}),", ",(0,i.jsx)(n.code,{children:"name"}),", and `description``, which help define their purpose and role within the architecture."]}),"\n"]}),"\n",(0,i.jsxs)(n.h3,{id:"2-relationships",children:["2. ",(0,i.jsx)(n.strong,{children:"Relationships"})]}),"\n",(0,i.jsx)(n.p,{children:"Relationships define how nodes interact, connect, or depend on each other. They represent the connections, data flows, and dependencies that exist within the system."}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Types of Relationships"}),": Includes direct interactions ",(0,i.jsx)(n.code,{children:"interacts"}),", connections between interfaces ",(0,i.jsx)(n.code,{children:"connects"}),", deployment contexts ",(0,i.jsx)(n.code,{children:"deployed-in"}),", and hierarchical compositions ",(0,i.jsx)(n.code,{children:"composed-of"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Properties"}),": Relationships include properties like unique-id, relationship-type, description, protocol, and authentication to detail the nature of the interaction."]}),"\n"]}),"\n",(0,i.jsxs)(n.h3,{id:"3-metadata",children:["3. ",(0,i.jsx)(n.strong,{children:"Metadata"})]}),"\n",(0,i.jsx)(n.p,{children:"Metadata allows architects to capture additional information that provides context or drives specific behaviors in the architecture. This can include compliance tags, custom attributes, or operational data."}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Flexible and Extensible"}),": Metadata can be applied to nodes, relationships, or the entire architecture, allowing you to enrich your models with any additional information required by your organization."]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"calm-schema-a-json-meta-schema",children:"CALM Schema: A JSON Meta Schema"}),"\n",(0,i.jsx)(n.p,{children:"CALM is built on a JSON Meta Schema, which serves as the blueprint for defining architecture. The schema is modular, extensible, and continuously evolving to support new capabilities. Key features of the CALM schema include:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"JSON-Based"}),": The use of JSON makes CALM compatible with many existing tools and technologies, facilitating integration into existing workflows."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Version Controlled"}),": CALM\u2019s schema versions are maintained to track changes and improvements, ensuring that your architecture definitions remain up-to-date."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Extensible Vocabulary"}),": CALM\u2019s schema includes a set of predefined terms and structures, but it can be extended to meet the specific needs of different organizations or projects."]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"benefits-of-calm",children:"Benefits of CALM"}),"\n",(0,i.jsx)(n.p,{children:"CALM offers several key benefits that make it a powerful tool for modern software architecture:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Consistency"}),": By using a common language and format, CALM ensures that all architecture definitions are consistent, reducing miscommunication and errors."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Traceability"}),": Architectural changes can be tracked and managed just like code, providing a clear history of design decisions and modifications."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Automation"}),": CALM\u2019s integration with CLI tools allows for automated validation, visualization, and compliance checks, streamlining the development process."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Integration with CI/CD"}),": CALM\u2019s code-based approach means that architecture can be validated and tested alongside the software it describes, preventing issues before they reach production."]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"getting-started-with-calm",children:"Getting Started with CALM"}),"\n",(0,i.jsx)(n.p,{children:"To start using CALM, you can install the CALM CLI and begin exploring its capabilities:"}),"\n",(0,i.jsxs)(n.ol,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Install the CLI"}),": Install the CALM CLI using npm with the following command:","\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-shell",children:"npm install -g @finos/calm-cli\n"})}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Explore the CLI Commands"}),": Use the CLI to generate, validate, and visualize architectural patterns and instantiations."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Join the Community"}),": Contribute to the CALM monorepo, engage with other architects, and help evolve the standard."]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>o,x:()=>r});var i=t(6540);const s={},a=i.createContext(s);function o(e){const n=i.useContext(a);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),i.createElement(a.Provider,{value:n},e.children)}}}]);