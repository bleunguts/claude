zero2hero (Raisim Sen, AWS solution architect, GCP)

Agentic AI
- skills
- MCP (lots of companies provide there services as MCP PayPal, Stripe)
- Plugin 
- Repo 
	- AGENT.md (special file that describes the entire eco-system, the boundaries of the system, provide to agent don't go out of the scope)

MCP - can create PR, and use it to review PR

AI has createed more than 100 new titles and new jobs to the world e.g. prompt engineer

You need experience, you can get your product delivered in a cheaper way
lots of companies pay £1000 a month, instead of using PDF documents that increases token usage, you can use plain text

18:38 speech starts with Raisim

React - JavaScript library that works on client browser
NextJS allows it to compile on server-side 
Component based technology, it's one-way (as opposed to two-way in Angular)
JSX separate design and code

Props are used to update variables between components
React 19 (released 2024-2025) 
- latest version Server side features closer to NextJS, Server Actions, Better SEO 

Vibe coding
- we don't change any single line of code manually
- you are writing a prompt, refinement 'steering' the AI
- Prompt with precision - use meta commands, being pilot will consume tokens

Prompt Architecture
- Assign a Role, act as a front end developer, act as a RAD developer. If you don't assign a role it will think about everything, weather, science, EVERYTHING.  Act as a doctor, act as a nurse, act as a software engineer
- Task, 
- Context, Describe the context
- Give it some Example, I want a online store, look at amazon website
- Give me in a Format, generate a video, give me a PDF
- Note 

'Don't fight flow' - when you try to make it perfect.  keep in zone keep going.  Refactor later
- Manual testing - is essential
Advanced Prompt Types - Generative AI
- Chain of thought, 
- Tree of thought, starts with one point and spreads out into branches and spirals branches.
Collects everything and returns the best one
- Graph of Thought, this is the expensive one, it learns from previous node.
- Recipe Pattern is common pattern step by step.. You approve each step, if you have problems ask

Agentic AI
- Skills, are created globally available 
- Codex, Coding agent actually edit files
- MCP connect to GitHub, browsing tools
- Plugins, combine a skill with eternal services
- AGENT.md, project specific development role

Start with the Idea to Production
- Idea analysis using AI, explain it in my words, and ask AI to make analysis about this project
- Prompt generations for SDLC, don't say to AI generate website for B2B or B2C.  instead say I want to step-by-step to build a website, and gives me prompts for each step.  
AI gives optimized prompts
- START to develop, you shouldn't give AI apikeys to production as it shares with AI cloud, don't share real prod database ..
- Apply each step and validate/test, fix the issues, commit changes frequently to GitHub

AI based react component library
https://21st.dev/community/components

- Bolt.new code generation, 6 months ago he used Bolt.new to generate website and mobile apps, but now Claude has token over so it has been redunduant
- Supabase postgres
- Figma = design the UI visually, is primarily a UI/UX design tool. 
Excellent for prototyping UIs
- Bolt.new = build the UI/application from a prompt, often using AI.
https://bolt.new/ - website generation using Claude prompts

"This is how I think a Credit Risk / PFE dashboard should look."
You then send your colleague a Figma link, and they can click around the prototype in their browser.
"I want a working web page with fake credit-risk data, interactive tables, charts, filters and navigation."
You can give Bolt a prompt, have it generate the React/HTML application, and then share the working prototype.

Compile a prompt list
You are a senior React engineer.
Create a React app
Create a skeleton first

Here is requirements:
Use typescript
Install dependencies

I want to create a react app which is a game, what is the tech stack to use?
For this project , step-by-step give me the prompts, I don't want to create all in one shot

Claude is very good at deep analysis and prompt generation, ask Claude what is the best prompt

I want to use Typescript, update the prompts according to that

codepen.io (scratch pad for react )

21st.dev -> Components -> header, find a header drop down menu
21st.dev -> Components -> maps, find a google map
Create the header menu according to attached prompt

VSCODE -> Codex plugin

CLAUDE.md
line length = 120
method line less than 15 lines
You can put these company policies into skills
e.g.
# Coding Standards

## General
- Maximum line length: 120 characters.
- Methods should generally be fewer than 15 lines.
- Follow the existing coding style in the project.
- Do not introduce unnecessary abstractions.


https://github.com/zero2hero-meta/react-quiz-challenge/blob/main/react-quiz-challenge-prompt-list.md
