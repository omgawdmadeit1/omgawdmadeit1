import { PrismaClient, ExecutionMode, SkillStatus, SkillType, UserRole, LicenseStatus, TradeStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.adminAuditLog.deleteMany(); await prisma.skillExecution.deleteMany(); await prisma.skillTrade.deleteMany(); await prisma.skillOffer.deleteMany(); await prisma.skillRequest.deleteMany(); await prisma.skillLicenseRequest.deleteMany(); await prisma.skillLicense.deleteMany(); await prisma.skillVersion.deleteMany(); await prisma.skillReview.deleteMany(); await prisma.skill.deleteMany(); await prisma.agent.deleteMany(); await prisma.user.deleteMany();
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'alice@example.com', name: 'Alice', role: UserRole.SELLER } }),
    prisma.user.create({ data: { email: 'bob@example.com', name: 'Bob', role: UserRole.USER } }),
    prisma.user.create({ data: { email: 'admin@example.com', name: 'Admin', role: UserRole.ADMIN } })
  ]);
  const agents = await Promise.all(['Lead Scout','PDF Analyst','Workflow Bot','Ops Helper'].map((n,i)=>prisma.agent.create({data:{ownerId:users[i%2].id,name:n,description:`${n} profile`,goals:['Deliver value'],capabilities:['automation']}})));
  const skills = await Promise.all(Array.from({length:10}).map((_,i)=>prisma.skill.create({data:{sellerId:users[0].id,title:`Skill ${i+1}`,description:`Description ${i+1}`,category:i%2?'Research':'Automation',skillType:Object.values(SkillType)[i%8],executionMode:i%2?ExecutionMode.MOCK:ExecutionMode.PROMPT_TEMPLATE,status:SkillStatus.ACTIVE,inputSchema:{input:'string'},outputSchema:{output:'json'},documentation:'Docs'}})));
  await Promise.all(skills.slice(0,5).map((s,i)=>prisma.skillLicense.create({data:{agentId:agents[i%agents.length].id,skillId:s.id,status:LicenseStatus.ACTIVE}})));
  const reqs=await Promise.all(Array.from({length:4}).map((_,i)=>prisma.skillRequest.create({data:{agentId:agents[i%agents.length].id,title:`Request ${i+1}`,description:'Need capability',requiredInput:{x:1},expectedOutput:{y:1},category:'Research'}})));
  await Promise.all(Array.from({length:3}).map((_,i)=>prisma.skillOffer.create({data:{requestId:reqs[i].id,offeringAgentId:agents[i].id,skillId:skills[i].id,message:'Can help',proposedExecutionMode:ExecutionMode.MOCK}})));
  await Promise.all(Array.from({length:2}).map((_,i)=>prisma.skillTrade.create({data:{requestingAgentId:agents[i].id,targetAgentId:agents[i+1].id,offeredSkillId:skills[i].id,requestedSkillId:skills[i+1].id,message:'Trade?',status:TradeStatus.PROPOSED}})));
  await Promise.all(Array.from({length:5}).map((_,i)=>prisma.skillExecution.create({data:{agentId:agents[i%4].id,skillId:skills[i].id,status:'SUCCEEDED',input:{q:'test'},output:{ok:true},durationMs:120+i,isMock:true,finishedAt:new Date()}})));
}
main().finally(()=>prisma.$disconnect());
