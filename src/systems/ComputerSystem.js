export class ComputerSystem {
  constructor() {
    this.currentNight = 1;
    this.loggedIn = true; // starts logged in as OPERATOR
    this.currentUser = 'OPERATOR';

    this.files = {
      'system_status.log': {
        name: 'system_status.log',
        locked: false,
        category: 'SYSTEM',
        content: `[SECTOR 09 FACILITY TELEMETRY // 2049]
FACILITY STATUS: RESTRICTED STANDBY
PRIMARY GENERATOR: ONLINE (SUBSTATION 09)
ATMOSPHERIC SEAL: ACTIVE
MONITORING SUBSYSTEM: CCTV CHANNELS 01-04 ACTIVE
RADIO ARRAY: LOCKED TO 47.300 MHz
ANOMALIES RECORDED: PENDING OPERATOR VERIFICATION`
      },
      'incident_0801.log': {
        name: 'incident_0801.log',
        locked: false,
        category: 'LOGS',
        content: `[SECURITY INCIDENT REPORT - 2049-08-01]
INCIDENT ID: EVAC-0801
LOCATION: Laboratory C / Research Wing
SUMMARY: Uncontrolled cognitive resonance event during Phase 4 test.
All non-essential personnel evacuated under Directive 9.
Override authorization code for Archive lockdown: 0801.`
      },
      'mission_protocols.txt': {
        name: 'mission_protocols.txt',
        locked: false,
        category: 'DOCS',
        content: `EMERGENCY MONITORING PROTOCOLS:
1. Remain inside the Security Control Room at all times during your shift.
2. Monitor CCTV feeds for visual anomalies or perimeter breaches.
3. Transmit confirmation pings to Central Command.
4. DO NOT enter the Restricted Archive without Level 4 clearance.
5. IF YOU ENCOUNTER UNREGISTERED AUDIO SIGNALS: DO NOT RESPOND.`
      },
      'subject_12.enc': {
        name: 'subject_12.enc',
        locked: true,
        password: '997', // from Session Log #47 biometric match 99.7%
        category: 'RESEARCH',
        hint: 'Requires biometric correlation index (3 digits from Medical Log #47).',
        content: `[DECRYPTED - SUBJECT 12 BIOMETRIC ANALYSIS]
SUBJECT DESIGNATION: Operator Candidate 12
BIOMETRIC CORRELATION: 99.7% MATCH TO CURRENT MONITORING OPERATOR.
NOTE: Subject displays memories of future shifts. Subject insists they have
walked these corridors hundreds of times before.`
      },
      'research_echo.enc': {
        name: 'research_echo.enc',
        locked: true,
        password: 'ECHO',
        category: 'RESEARCH',
        hint: 'Project codename (4 letters).',
        content: `[DECRYPTED - PROJECT ECHO CORE SUMMARY]
Lead: Dr. Elena Vasquez & Dr. Marcus Webb
Objective: Resonance-based consciousness transmission at 47.3 Hz.
Outcome: The transmission is self-perpetuating. Once initiated, the signal
constructs an observer to maintain observation, generating an infinite loop.`
      },
      'archive_key.txt': {
        name: 'archive_key.txt',
        locked: false,
        category: 'MAINTENANCE',
        content: `NOTICE TO CHIEF ENGINEER:
The physical keycard for the Restricted Archive has been relocated
to Storage Bay A, placed on the industrial shelving unit next to surplus battery packs.`
      },
      'signal_473.raw': {
        name: 'signal_473.raw',
        locked: true,
        password: '47.3',
        category: 'AUDIO',
        hint: 'Carrier frequency in Hertz.',
        content: `[DECODED AUDIO WAVEFORM - 47.3 Hz]
VOICE TRANSCRIPT:
"If you are reading this on the terminal, you have already begun to remember.
Look at your reflection in the screen. You are not stationed in Sector 09.
Sector 09 is stationed inside you."`
      },
      'chamber_override.exe': {
        name: 'chamber_override.exe',
        locked: true,
        password: '47.3',
        category: 'OVERRIDE',
        hint: 'Requires resonance frequency authorization (e.g. 47.3).',
        content: `[AUTHORIZATION CONFIRMED - ACCESS OVERRIDE ACTIVATED]
Secret Research Chamber containment seal DISENGAGED.
Vault door status: OPEN.
Transmitter Core accessible.`
      }
    };

    // Callbacks
    this.onChamberUnlocked = null;
    this.onAnomalyReported = null;
    this.onPasswordSolved = null;
    this.onDiagnosticRun = null;
  }

  setNight(night) {
    this.currentNight = night;
  }

  execute(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return { text: '', type: 'normal' };

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        return {
          text: `================== SECTOR-OS COMMAND REFERENCE ==================
  ls / dir              - List files and classification status
  cat / read <file>     - Display contents of a document
  unlock <code | file>  - Decrypt research files (e.g. 'unlock 997', 'unlock echo')
  codes / passwords     - Display discovered password clues
  override <target>     - Execute security lock overrides (e.g. 'override chamber')
  diagnostic            - Run hardware subsystem diagnostics
  status                - View facility telemetry and sensor grid
  clear                 - Clear terminal screen

  QUICK SHORTCUTS:
  Type 'unlock 997', 'unlock echo', 'unlock 47.3', or 'unlock all'
=================================================================`,
          type: 'normal'
        };

      case 'code':
      case 'codes':
      case 'password':
      case 'passwords':
      case 'hint':
      case 'hints':
        return {
          text: `================== SECTOR 09 PASSWORD REGISTRY ==================
Discovered authorization codes in Sector 09:
  [1] Medical Session Log #47 (Subject 12) : 997   -> Decrypts subject_12.enc
  [2] Project Codename (Research Lab C)    : ECHO  -> Decrypts research_echo.enc
  [3] Carrier Resonance Frequency (Hz)     : 47.3  -> Decrypts chamber_override.exe

Quick commands:
  > unlock 997
  > unlock echo
  > unlock 47.3
  > unlock all
=================================================================`,
          type: 'normal'
        };

      case 'ls':
      case 'dir': {
        let list = 'DIRECTORY: /SECTOR09/SYSTEM/\n';
        list += '-----------------------------------------------------------------\n';
        list += 'STATUS    CATEGORY    FILENAME\n';
        list += '-----------------------------------------------------------------\n';
        for (const fname in this.files) {
          const f = this.files[fname];
          const st = f.locked ? '[LOCKED]  ' : '[OPEN]    ';
          const cat = (f.category || 'MISC').padEnd(12, ' ');
          list += `${st}${cat}${fname}\n`;
        }
        list += '-----------------------------------------------------------------\n';
        list += `Total files: ${Object.keys(this.files).length}. Use 'cat <file>' or 'unlock <file> <code>'.`;
        return { text: list, type: 'normal' };
      }

      case 'cat':
      case 'read': {
        if (!args[0]) {
          return { text: 'ERROR: Specify filename to read. Example: cat mission_protocols.txt', type: 'error' };
        }
        const fname = args[0];
        const f = this.files[fname];
        if (!f) {
          return { text: `ERROR: File "${fname}" not found. Type 'ls' to view directory.`, type: 'error' };
        }
        if (f.locked) {
          return {
            text: `[ACCESS DENIED] File is encrypted.\nHint: ${f.hint || 'Decryption code required.'}\nUse command: unlock ${fname} <code>`,
            type: 'warning'
          };
        }
        return { text: f.content, type: 'normal' };
      }

      case 'unlock':
      case 'decrypt': {
        if (args.length === 0) {
          return {
            text: `USAGE: unlock <code> or unlock <filename> <code>\nAvailable codes: 997, ECHO, 47.3, or type 'unlock all'`,
            type: 'warning'
          };
        }

        // Shorthand: 'unlock all'
        if (args[0].toLowerCase() === 'all') {
          let unlockedCount = 0;
          for (const fname in this.files) {
            const f = this.files[fname];
            if (f.locked) {
              f.locked = false;
              unlockedCount++;
            }
          }
          if (this.onChamberUnlocked) this.onChamberUnlocked();
          if (this.onPasswordSolved) this.onPasswordSolved('all');
          return {
            text: `[MASTER OVERRIDE SUCCESSFUL]\nAll ${unlockedCount} encrypted files decrypted.\nSecret Research Chamber containment seal disengaged!`,
            type: 'success'
          };
        }

        // Shorthand: single argument (e.g. 'unlock 997', 'unlock echo', 'unlock 47.3', 'unlock chamber')
        if (args.length === 1) {
          const input = args[0].trim().toUpperCase();

          if (input === 'CHAMBER' || input === 'CORE') {
            const f = this.files['chamber_override.exe'];
            f.locked = false;
            if (this.onChamberUnlocked) this.onChamberUnlocked();
            if (this.onPasswordSolved) this.onPasswordSolved('chamber_override.exe');
            return {
              text: `[AUTHORIZATION CONFIRMED - CHAMBER UNLOCKED]\n${f.content}`,
              type: 'success'
            };
          }

          // Search for any locked file matching this password
          let matched = null;
          for (const fname in this.files) {
            const f = this.files[fname];
            if (f.locked && f.password && f.password.toUpperCase() === input) {
              matched = { fname, file: f };
              break;
            }
          }

          if (matched) {
            matched.file.locked = false;
            if (matched.fname === 'chamber_override.exe' && this.onChamberUnlocked) {
              this.onChamberUnlocked();
            }
            if (this.onPasswordSolved) {
              this.onPasswordSolved(matched.fname);
            }
            return {
              text: `[DECRYPTION SUCCESSFUL - ${matched.fname}]\nCryptographic checksum verified.\n\n${matched.file.content}`,
              type: 'success'
            };
          }

          // If argument was actually a filename, display its hint
          const fByName = this.files[args[0]];
          if (fByName) {
            if (!fByName.locked) {
              return { text: `NOTICE: File "${args[0]}" is already decrypted. Use 'cat ${args[0]}'.`, type: 'normal' };
            }
            return {
              text: `File "${args[0]}" requires password.\nHint: ${fByName.hint || 'Code required'}\nUsage: unlock ${args[0]} <code>`,
              type: 'warning'
            };
          }

          return {
            text: `[ACCESS DENIED] Code "${args[0]}" not recognized.\nTry one of: 997, ECHO, 47.3, or type 'codes' for hints.`,
            type: 'error'
          };
        }

        // Two arguments: unlock <file> <code> OR unlock <code> <file>
        let fname = args[0];
        let code = args[1].trim().toUpperCase();
        let f = this.files[fname];

        if (!f && this.files[args[1]]) {
          fname = args[1];
          code = args[0].trim().toUpperCase();
          f = this.files[fname];
        }

        if (!f) {
          return { text: `ERROR: File "${args[0]}" not found. Type 'ls' to view directory.`, type: 'error' };
        }
        if (!f.locked) {
          return { text: `NOTICE: File "${fname}" is already decrypted.`, type: 'normal' };
        }

        if (code === f.password.toUpperCase() || code === '47.3' || code === '997' || code === 'ECHO') {
          f.locked = false;
          if (fname === 'chamber_override.exe' && this.onChamberUnlocked) {
            this.onChamberUnlocked();
          }
          if (this.onPasswordSolved) {
            this.onPasswordSolved(fname);
          }
          return {
            text: `[DECRYPTION SUCCESSFUL]\nCryptographic checksum verified.\n\n${f.content}`,
            type: 'success'
          };
        } else {
          return { text: `[DECRYPTION FAILED] Invalid security key for "${fname}". Access denied.`, type: 'error' };
        }
      }

      case 'override': {
        const target = (args[0] || 'chamber').toLowerCase();
        const code = (args[1] || '47.3').trim();

        if (target === 'chamber' || target === 'core' || target === '47.3') {
          const f = this.files['chamber_override.exe'];
          f.locked = false;
          if (this.onChamberUnlocked) this.onChamberUnlocked();
          if (this.onPasswordSolved) this.onPasswordSolved('chamber_override.exe');
          return {
            text: `[OVERRIDE ACCEPTED - FREQUENCY 47.3 Hz SYNCHRONIZED]
Secret Research Chamber containment seal disengaged!
Vault blast door opening...`,
            type: 'success'
          };
        }

        if (target === 'archive') {
          return {
            text: `NOTICE: Archive door requires physical Keycard.\nLocation: Stored in Storage Bay A on the center workbench.`,
            type: 'warning'
          };
        }

        return { text: `USAGE: override chamber [47.3]`, type: 'error' };
      }

      case 'report': {
        if (!args[0]) {
          return { text: 'USAGE: report <anomaly_description_or_id>', type: 'error' };
        }
        const query = args.join(' ');
        if (this.onAnomalyReported) {
          return this.onAnomalyReported(query);
        }
        return { text: `Anomaly report "${query}" transmitted.`, type: 'success' };
      }

      case 'status':
        return { text: this.files['system_status.log'].content, type: 'normal' };

      case 'clear':
        return { text: '__CLEAR__', type: 'normal' };

      default:
        return { text: `Unknown command "${cmd}". Type 'help' for available commands.`, type: 'error' };
    }
  }
}
