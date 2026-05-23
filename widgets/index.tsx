import React from 'react';

export const SkillSearchResults = ({ skills }: { skills: any[] }) => <pre>{JSON.stringify(skills, null, 2)}</pre>;
export const SkillDetailCard = ({ skill }: { skill: any }) => <pre>{JSON.stringify(skill, null, 2)}</pre>;
export const AgentProfileCard = ({ agent }: { agent: any }) => <pre>{JSON.stringify(agent, null, 2)}</pre>;
export const LicenseRequestPanel = ({ request }: { request: any }) => <pre>{JSON.stringify(request, null, 2)}</pre>;
export const TradeProposalPanel = ({ trade }: { trade: any }) => <pre>{JSON.stringify(trade, null, 2)}</pre>;
export const ExecutionResultViewer = ({ execution }: { execution: any }) => <pre>{JSON.stringify(execution, null, 2)}</pre>;
