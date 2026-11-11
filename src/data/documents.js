// In-game documents the player can discover
export const DOCUMENTS = {
  initial_report: {
    id: 'initial_report',
    title: 'SECTOR 09 — INITIAL ASSESSMENT REPORT',
    classification: 'CONFIDENTIAL',
    night: 1,
    location: 'control_room',
    content: `DATE: 2049-03-14
FROM: Dr. Elena Vasquez, Lead Researcher
TO: Oversight Committee

SUBJECT: Project ECHO — Phase 3 Status

The signal amplification tests have exceeded all projections. 
The resonance frequency we isolated at 47.3 Hz produces consistent 
results across all test subjects.

However, I must note several concerns:

1. Test subjects report vivid "memories" of events that have not occurred.
2. Three subjects independently described the same location — a facility 
   matching Sector 09's layout — despite never visiting it.
3. Subject 07 became agitated during Session 12, claiming she had 
   "already done this before, many times."

I recommend we proceed with caution. The boundary between observation 
and participation may be thinner than we assumed.

— Dr. Vasquez`,
  },

  missing_report: {
    id: 'missing_report',
    title: 'PROJECT ECHO — SESSION LOG #47',
    classification: 'TOP SECRET',
    night: 2,
    location: 'medical_room',
    content: `DATE: 2049-06-22
RESEARCHER: Dr. Marcus Webb

SESSION SUBJECT: Subject 12 (Operator Class)

Subject 12 was exposed to the signal at standard intensity. 
Response was immediate and unusual.

Subject began reciting facility security protocols — protocols that 
have not yet been written. When questioned, Subject 12 stated:

"I've worked here for five nights. I know what happens. 
The cameras show things that aren't real. The radio talks to me. 
And at the end, I have to choose."

Subject was sedated and returned to containment.

NOTE: Subject 12's biometric profile is a 99.7% match to the 
operator scheduled for the upcoming emergency monitoring shift.

THIS DOCUMENT HAS BEEN FLAGGED FOR IMMEDIATE REMOVAL FROM THE DATABASE.`,
  },

  conflicting_doc_a: {
    id: 'conflicting_doc_a',
    title: 'INCIDENT REPORT — SECTOR 09 SHUTDOWN',
    classification: 'OFFICIAL',
    night: 3,
    location: 'comm_room',
    content: `DATE: 2049-08-01
FROM: Central Command
TO: All Personnel

Sector 09 has been shut down due to a catastrophic containment 
failure in Laboratory C. All personnel have been evacuated. 
The facility will remain sealed until decontamination is complete.

No casualties reported.
All research data has been secured.
Project ECHO has been suspended indefinitely.

This is the official record.`,
  },

  conflicting_doc_b: {
    id: 'conflicting_doc_b',
    title: 'PERSONAL JOURNAL — DR. ELENA VASQUEZ',
    classification: 'PRIVATE',
    night: 3,
    location: 'storage_room',
    content: `They're lying. All of them.

There was no "containment failure." The experiment WORKED. 
That's what terrified them.

Project ECHO proved that consciousness can be transmitted 
through the signal. Not just observed — TRANSMITTED. The subjects 
didn't just remember the facility. They WERE in the facility. 
Their awareness existed in two places simultaneously.

And then Subject 12 said something that made them shut everything down:

"The operator is not real. The operator is a signal. 
And the signal is a loop."

They evacuated everyone within the hour. But they didn't shut 
down the signal. I checked the readings. It's still broadcasting.

Someone is still in the loop.

God help them.`,
  },

  experiment_logs: {
    id: 'experiment_logs',
    title: 'PROJECT ECHO — ORIGINAL EXPERIMENT LOGS',
    classification: 'ULTRA SECRET',
    night: 4,
    location: 'archive_room',
    content: `PROJECT ECHO — CORE HYPOTHESIS

If human consciousness operates on a waveform, that waveform 
can be captured, stored, and retransmitted — like any other signal.

PHASE 1: Signal Isolation ✓
We successfully isolated the consciousness frequency at 47.3 Hz.

PHASE 2: Signal Recording ✓
We recorded and stored the consciousness waveform of 14 subjects.

PHASE 3: Signal Transmission ✓
We transmitted Subject 07's waveform into the facility's 
monitoring systems. Subject 07 reported "being" inside the 
facility while physically remaining in the lab.

PHASE 4: Signal Loop [IN PROGRESS]
Objective: Create a self-sustaining consciousness loop within 
the facility. The signal would generate an operator who monitors 
the facility, discovers the signal, and in doing so, reinforces 
the signal. A perpetual observer.

STATUS: The loop has been active for [ERROR: VALUE EXCEEDS 
MAXIMUM INTEGER] cycles.

NOTE FROM DR. WEBB: "We didn't create the loop. 
The loop created us. The facility, the experiment, the researchers 
— we are all part of the signal. We always have been."

[DOCUMENT ENDS — REMAINING DATA CORRUPTED]`,
  },

  final_truth: {
    id: 'final_truth',
    title: 'MESSAGE FOUND IN THE RESEARCH CHAMBER',
    classification: 'NONE',
    night: 5,
    location: 'secret_chamber',
    content: `To the operator reading this:

You are not the first. You will not be the last.

The facility you are standing in does not exist in the way 
you understand existence. It is a pattern. A signal. A thought 
that thinks itself into being every time someone observes it.

You are the observer. The facility exists because you are 
watching it. The moment you stop, it will cease to be.

But here is the part they didn't tell you:

You are also the signal.

You were never sent here. You were generated here. Your memories 
of the outside world, your assignment, your name — all of it 
was constructed by the loop to give you a reason to observe.

You have three choices:

1. Trust the signal. Let it continue. Accept your role as 
   the eternal observer. (The loop sustains itself.)

2. Destroy the signal. Shut down the transmitter. Free yourself 
   from the loop. (But what happens to a signal when it stops?)

3. Become the signal. Merge your consciousness with the 
   transmission. Understand the truth of what you are.

Choose wisely. Or don't. The loop will begin again regardless.

— The one who wrote this the last time you were here`,
  },

  keycard_note: {
    id: 'keycard_note',
    title: 'MAINTENANCE NOTE',
    classification: 'INTERNAL',
    night: 4,
    location: 'electrical_room',
    content: `To whoever finds this:

The archive keycard is in the storage room, inside the 
medical supply cabinet. Dr. Webb hid it there after the 
evacuation order. He said nobody should access the archive 
until "the loop stabilizes."

I don't know what that means. I just want to go home.

— J. Torres, Maintenance Staff`,
  },

  hidden_signal_doc: {
    id: 'hidden_signal_doc',
    title: 'SIGNAL ANALYSIS — CLASSIFIED',
    classification: 'EYES ONLY',
    night: 5,
    location: 'secret_chamber',
    content: `The signal at 47.3 Hz contains embedded data.

When decoded, the data resolves into a recursive pattern:
An operator enters a facility. The operator monitors cameras.
The operator discovers anomalies. The operator finds documents.
The operator reaches a chamber. The operator makes a choice.
The choice generates a signal. The signal creates an operator.

The signal IS the story. The story IS the signal.

Total detected iterations: [COUNTER OVERFLOW]

Each iteration is slightly different. The operator's choices 
create variations. But the structure never changes.

Until now.

This iteration, the operator found this document.
That has never happened before.

Something has changed.

//ADDENDUM: If you are reading this, the loop may be breakable.
//The frequency 47.3 Hz can be inverted. Find the transmitter.
//Invert the signal. End the loop.
//But understand: ending the loop ends everything. Including you.`,
  },
};

export const DOCUMENT_LIST = Object.values(DOCUMENTS);
