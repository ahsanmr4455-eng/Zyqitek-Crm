import { CallScript, EmailScript } from '../types';

export const DEFAULT_CALL_SCRIPTS: Omit<CallScript, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Discovery & Needs Identification Call",
    description: "Initial call script to uncover client pain points, timeline, and budget.",
    category: "Discovery / Qualification",
    status: "Active",
    content: `Greeting: "Hi {Client_Name}, this is {My_Name} from Zyqitek. Thanks for taking the time to speak today."\n\nPurpose: "I wanted to learn a bit more about your current process for {Service_Name} and see if we might be a good fit to help you scale."\n\nKey Discovery Questions:\n1. "What are the biggest challenges you're currently facing with your project workflow?"\n2. "What goals are you aiming to hit over the next quarter?"\n3. "Have you worked with a specialized agency for this before?"\n\nNext Steps: "Based on what you've shared, I'd love to prepare a tailored proposal for your review. How does early next week sound for a quick walkthrough?"`
  },
  {
    title: "Cold Outreach - High Value Offer",
    description: "Direct cold call pitch focusing on ROI and core agency services.",
    category: "Cold Calling",
    status: "Active",
    content: `Opening: "Hi {Client_Name}, I know I caught you out of the blue, do you have 30 seconds for me to tell you why I called?"\n\nPitch: "We help high-growth companies like yours increase revenue through high-converting {Service_Name}. Recently, we helped a similar client boost their conversions by 35% within 60 days."\n\nHook: "I was looking at {Company_Name}'s online presence and noticed a few key opportunities where you could immediately optimize."\n\nCall to Action: "Are you open to a 10-minute demo next Tuesday to see how this could work for your team?"`
  },
  {
    title: "Objection Handling - Price & Budget",
    description: "Script for responding when a prospect hesitates on pricing or budget.",
    category: "Objection Handling",
    status: "Active",
    content: `Prospect Objection: "Your services seem more expensive than others we've looked at."\n\nResponse Framework:\n1. Acknowledge: "I completely understand. Budget is a top priority for any growing business."\n2. Value Pivot: "When comparing options, most of our clients find that cheaper alternatives often require double the revision cycles and lack dedicated account managers."\n3. Proof: "We structure our scope to focus strictly on measurable ROI and guaranteed delivery timelines."\n4. Question: "If we could customize a phased rollout that fits your target budget this month, would that make sense to explore?"`
  }
];

export const DEFAULT_EMAIL_SCRIPTS: Omit<EmailScript, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    templateName: "Initial Introduction & Services Pitch",
    subject: "Quick question regarding {Company_Name}'s {Service_Name}",
    category: "Cold Outreach",
    status: "Active",
    body: `Hi {Client_Name},\n\nI hope this email finds you well.\n\nI came across {Company_Name} and was really impressed by your recent work. My team at Zyqitek specializes in premium {Service_Name} designed to help growing brands scale faster and convert more leads.\n\nWe've recently helped businesses in your industry streamline their workflow and achieve measurable growth.\n\nWould you be open to a quick 10-minute chat this week to see if we might be a good fit for your upcoming goals?\n\nBest regards,\n{My_Name}\nZyqitek Digital Solutions`
  },
  {
    templateName: "Proposal & Pricing Follow-up",
    subject: "Following up on your Zyqitek proposal - {Company_Name}",
    category: "Follow-up",
    status: "Active",
    body: `Hi {Client_Name},\n\nI wanted to follow up on the proposal we sent over for {Service_Name}.\n\nHave you had a chance to review the scope and pricing breakdown with your team?\n\nIf you have any questions or would like to make any adjustments to the deliverables, I'd be happy to hop on a brief call or answer them right here over email.\n\nLooking forward to hearing your thoughts!\n\nBest regards,\n{My_Name}\nZyqitek Digital Solutions`
  },
  {
    templateName: "Re-engagement & Inactive Client Check-in",
    subject: "Checking in on {Company_Name}'s growth goals",
    category: "Re-engagement",
    status: "Active",
    body: `Hi {Client_Name},\n\nIt's been a little while since we last connected! I wanted to check in and see how things are progressing with {Company_Name}.\n\nWe've recently introduced updated frameworks for {Service_Name} that have been delivering fantastic results for our partners.\n\nIf you have new projects on the horizon, I'd love to reconnect and share a few fresh ideas. Are you free for a brief call next week?\n\nBest regards,\n{My_Name}\nZyqitek Digital Solutions`
  }
];
