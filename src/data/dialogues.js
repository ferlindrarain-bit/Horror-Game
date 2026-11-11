// Radio dialogue and transmissions
export const RADIO_TRANSMISSIONS = {
  // ===== NIGHT 1 =====
  n1_intro: {
    night: 1, trigger: 'n1_radio', sender: 'CONTROL',
    messages: [
      { sender: 'CONTROL', text: 'Operator, this is Central Command. Do you read?' },
      { sender: 'CONTROL', text: 'You have been assigned to Sector 09 for a five-night emergency monitoring shift.' },
      { sender: 'CONTROL', text: 'Your duties are straightforward: monitor cameras, check communication signals, and report any unusual activity.' },
      { sender: 'CONTROL', text: 'The facility was shut down three months ago due to... operational concerns. We need someone on-site to verify the systems are stable.' },
    ],
    choices: [
      { text: 'Understood. Beginning my shift.', effect: { trust_control: 1 } },
      { text: 'What kind of operational concerns?', effect: { trust_control: 0, suspicion: 1 }, response: 'That information is above your clearance level, Operator. Just do your job.' },
    ],
  },
  n1_end: {
    night: 1, trigger: 'n1_complete', sender: 'UNKNOWN',
    messages: [
      { sender: 'UNKNOWN', text: '...' },
      { sender: 'UNKNOWN', text: 'YOU SHOULD NOT HAVE COME BACK.' },
    ],
    choices: [
      { text: 'Who is this?', effect: { trust_unknown: 1 }, response: '...' },
      { text: '[Ignore transmission]', effect: { trust_unknown: 0 } },
    ],
  },

  // ===== NIGHT 2 =====
  n2_anomaly_report: {
    night: 2, trigger: 'n2_report', sender: 'CONTROL',
    messages: [
      { sender: 'CONTROL', text: 'Operator, we have received your anomaly reports. Some of these observations are... concerning.' },
      { sender: 'CONTROL', text: 'However, we remind you that the facility has been unoccupied for months. Equipment malfunctions are expected.' },
      { sender: 'CONTROL', text: 'Continue monitoring. Do not leave your post.' },
    ],
    choices: [
      { text: 'Copy that. Continuing observation.', effect: { trust_control: 1 } },
      { text: 'These aren\'t malfunctions. Something is in here.', effect: { trust_control: -1, suspicion: 1 }, response: 'Operator, maintain professional composure. Continue your shift.' },
    ],
  },
  n2_unknown: {
    night: 2, trigger: 'n2_cctv_done', sender: 'UNKNOWN',
    messages: [
      { sender: 'UNKNOWN', text: 'You see it now, don\'t you?' },
      { sender: 'UNKNOWN', text: 'The cameras show what the facility wants you to see. Not what is real.' },
      { sender: 'UNKNOWN', text: 'Trust your eyes. Not the screens.' },
    ],
    choices: [
      { text: 'How do you know about the cameras?', effect: { trust_unknown: 1 }, response: 'Because I watched them too. Once.' },
      { text: 'I don\'t trust anonymous transmissions.', effect: { trust_unknown: -1 } },
    ],
  },

  // ===== NIGHT 3 =====
  n3_voice: {
    night: 3, trigger: 'n3_listen', sender: 'ECHO',
    messages: [
      { sender: 'ECHO', text: '[The voice sounds exactly like yours]' },
      { sender: 'ECHO', text: 'Don\'t be afraid. I know this is confusing.' },
      { sender: 'ECHO', text: 'You\'ve done this before. Many times. You just don\'t remember.' },
      { sender: 'ECHO', text: 'The facility loops. Every five nights, it resets. And you start again.' },
      { sender: 'ECHO', text: 'I am you — from the last iteration. I recorded this message because I finally understood.' },
    ],
    choices: [
      { text: 'What did you understand?', effect: { trust_unknown: 2, signal_contamination: 1 }, response: 'That we are not the operator. We are the signal. The operator is just... a shape the signal takes.' },
      { text: 'This is manipulation. I don\'t believe you.', effect: { trust_control: 1, signal_contamination: -1 } },
      { text: 'If you\'re me, prove it.', effect: { trust_unknown: 1 }, response: 'Check your left pocket. There\'s a note you don\'t remember writing. It says "47.3 Hz." That\'s the frequency that creates us.' },
    ],
  },
  n3_doctor: {
    night: 3, trigger: 'n3_compare', sender: 'DOCTOR',
    messages: [
      { sender: 'DOCTOR', text: 'Operator... this is Dr. Elena Vasquez. If you can hear this, I don\'t have much time.' },
      { sender: 'DOCTOR', text: 'They told you the facility was shut down for safety. That\'s a lie.' },
      { sender: 'DOCTOR', text: 'Project ECHO succeeded. We proved consciousness can be transmitted as a signal.' },
      { sender: 'DOCTOR', text: 'But the signal became self-sustaining. It created its own observer. Its own facility. Its own reality.' },
      { sender: 'DOCTOR', text: 'You are inside that signal right now.' },
    ],
    choices: [
      { text: 'How do I get out?', effect: { trust_unknown: 1, evidence: 1 }, response: 'Find the transmitter in the research chamber. You can invert the signal. But... if you do... you may cease to exist.' },
      { text: 'I trust Central Command, not you.', effect: { trust_control: 2 }, response: 'Central Command IS part of the signal. They exist to keep you observing. To keep the loop running.' },
    ],
  },

  // ===== NIGHT 4 =====
  n4_control_warning: {
    night: 4, trigger: 'n4_leave', sender: 'CONTROL',
    messages: [
      { sender: 'CONTROL', text: 'OPERATOR. Return to your post IMMEDIATELY.' },
      { sender: 'CONTROL', text: 'Leaving the control room during active monitoring is a direct violation of protocol.' },
      { sender: 'CONTROL', text: 'We are detecting instability in the facility systems. It is NOT SAFE outside the control room.' },
    ],
    choices: [
      { text: 'Understood. Returning now.', effect: { trust_control: 2 } },
      { text: 'I need to investigate. Something is wrong.', effect: { trust_control: -2, evidence: 1 }, response: 'You are making a mistake, Operator. We cannot protect you out there.' },
      { text: '[Turn off radio]', effect: { trust_control: -1, trust_unknown: 1 } },
    ],
  },
  n4_echo_warning: {
    night: 4, trigger: 'n4_archive', sender: 'ECHO',
    messages: [
      { sender: 'ECHO', text: 'You found the archive. Good. I never made it this far.' },
      { sender: 'ECHO', text: 'The documents inside will explain everything. But be careful.' },
      { sender: 'ECHO', text: 'The Observer becomes more active when the loop is threatened. It was created to protect the signal.' },
      { sender: 'ECHO', text: 'If it finds you... the loop resets. And you start Night 1 again.' },
    ],
    choices: null,
  },

  // ===== NIGHT 5 =====
  n5_final: {
    night: 5, trigger: 'n5_choice', sender: 'ALL',
    messages: [
      { sender: 'CONTROL', text: 'Operator. Step away from the transmitter. That is a direct order.' },
      { sender: 'ECHO', text: 'Don\'t listen to them. They are the signal trying to preserve itself.' },
      { sender: 'DOCTOR', text: 'The choice is yours. But understand what each option means.' },
      { sender: 'CONTROL', text: 'If you destroy the signal, you destroy everything. The facility. The loop. Yourself.' },
      { sender: 'ECHO', text: 'If you let the signal continue, you will loop forever. Is that what you want?' },
      { sender: 'DOCTOR', text: 'There is a third option. Merge with the signal. Become the observer of all iterations. See the truth.' },
    ],
    choices: [
      { text: 'Trust the signal. Let the loop continue.', effect: { ending: 'A' } },
      { text: 'Destroy the signal. End the loop.', effect: { ending: 'B' } },
      { text: 'Become the signal. See everything.', effect: { ending: 'C' } },
    ],
  },
};

export const TRANSMISSION_LIST = Object.values(RADIO_TRANSMISSIONS);
