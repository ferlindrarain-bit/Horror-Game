// Anomaly definitions
export const ANOMALY_TYPES = {
  // Visual anomalies
  cctv_figure_behind:   { id: 'cctv_figure_behind',   name: 'Figure Behind Player',         night: 1, category: 'visual',  dangerous: false, clue: true,  description: 'CCTV shows a figure standing behind you.' },
  object_moved:         { id: 'object_moved',          name: 'Displaced Object',             night: 2, category: 'visual',  dangerous: false, clue: false, description: 'An object has moved between observations.' },
  shadow_hallway:       { id: 'shadow_hallway',        name: 'Hallway Shadow',               night: 2, category: 'visual',  dangerous: false, clue: false, description: 'An unusual shadow moves in the hallway.' },
  impossible_room_cam:  { id: 'impossible_room_cam',   name: 'Impossible Room on Camera',    night: 2, category: 'visual',  dangerous: false, clue: true,  description: 'A camera shows a room that doesn\'t exist.' },
  writing_wall:         { id: 'writing_wall',          name: 'Strange Writing',              night: 3, category: 'visual',  dangerous: false, clue: true,  description: 'Writing appears on the wall that wasn\'t there before.' },
  clock_impossible:     { id: 'clock_impossible',      name: 'Impossible Time',              night: 3, category: 'visual',  dangerous: false, clue: false, description: 'The clock shows an impossible time.' },
  corridor_change:      { id: 'corridor_change',       name: 'Corridor Layout Change',       night: 4, category: 'spatial', dangerous: true,  clue: true,  description: 'The corridor layout has changed.' },
  door_unexpected:      { id: 'door_unexpected',       name: 'Unexpected Room Behind Door',  night: 4, category: 'spatial', dangerous: false, clue: true,  description: 'A door opens to an unexpected room.' },
  door_disappear:       { id: 'door_disappear',        name: 'Disappearing Door',            night: 4, category: 'spatial', dangerous: true,  clue: false, description: 'A door has vanished from the wall.' },
  photograph_change:    { id: 'photograph_change',     name: 'Photograph Changed',           night: 5, category: 'visual',  dangerous: false, clue: true,  description: 'A photograph has changed since you last looked.' },
  blood_appear:         { id: 'blood_appear',          name: 'Blood Stains Appear',          night: 5, category: 'visual',  dangerous: false, clue: false, description: 'Blood stains have appeared on the floor.' },

  // Audio anomalies
  footsteps_behind:     { id: 'footsteps_behind',      name: 'Footsteps Behind You',         night: 3, category: 'audio',   dangerous: false, clue: false, description: 'You hear footsteps behind you, but nobody is there.' },
  radio_player_voice:   { id: 'radio_player_voice',    name: 'Radio Plays Your Voice',       night: 3, category: 'audio',   dangerous: false, clue: true,  description: 'The radio transmission sounds exactly like you.' },

  // Technical anomalies
  computer_auto_message:{ id: 'computer_auto_message',  name: 'Computer Auto-Message',       night: 2, category: 'tech',    dangerous: false, clue: true,  description: 'The computer starts typing by itself.' },
  cctv_reality_conflict:{ id: 'cctv_reality_conflict', name: 'CCTV Reality Conflict',        night: 4, category: 'tech',    dangerous: false, clue: true,  description: 'CCTV and physical reality contradict each other.' },
  light_flicker:        { id: 'light_flicker',         name: 'Lights Flicker',               night: 1, category: 'tech',    dangerous: false, clue: false, description: 'The lights flicker briefly.' },
  camera_distortion:    { id: 'camera_distortion',     name: 'Camera Feed Distortion',       night: 2, category: 'tech',    dangerous: false, clue: false, description: 'A camera feed distorts and shows static.' },
  electrical_failure:   { id: 'electrical_failure',    name: 'Electrical Failure',           night: 4, category: 'tech',    dangerous: true,  clue: false, description: 'An electrical system fails unexpectedly.' },

  // Entity anomalies
  entity_sighting:      { id: 'entity_sighting',       name: 'The Observer Sighting',        night: 4, category: 'entity',  dangerous: true,  clue: true,  description: 'The Observer is watching from the shadows.' },
  entity_chase:         { id: 'entity_chase',          name: 'The Observer Chase',           night: 5, category: 'entity',  dangerous: true,  clue: false, description: 'The Observer pursues you through the facility.' },

  // Meta anomalies
  player_action_message:{ id: 'player_action_message', name: 'Message About Your Actions',   night: 5, category: 'meta',    dangerous: false, clue: true,  description: 'A message appears that references your in-game actions.' },
  meta_awareness:       { id: 'meta_awareness',        name: 'Facility Awareness',           night: 5, category: 'meta',    dangerous: false, clue: true,  description: 'STOP PLAYING. I KNOW YOU ARE WATCHING.' },
};

export const ANOMALY_LIST = Object.values(ANOMALY_TYPES);
