export const COLORS = {
  // Brand colors
  primary: '#2ecc71',
  primaryDark: '#27ae60',
  secondary: '#3498db',
  
  // Status colors
  success: '#2ecc71',
  info: '#3498db',
  warning: '#f39c12',
  danger: '#e74c3c',
  
  // Event type colors
  breeding: '#9b59b6',
  birth: '#e74c3c',
  health: '#e67e22',
  treatment: '#f1c40f',
  
  // UI colors
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#2c3e50',
  textSecondary: '#7f8c8d',
  border: '#ecf0f1',
  
  // Sync status
  synced: '#2ecc71',
  syncing: '#f39c12',
  pending: '#e74c3c',
  offline: '#7f8c8d',
};

export const EVENT_COLORS = {
  SERVICE: COLORS.primary,
  DIAGNOSTIC: COLORS.info,
  BIRTH: COLORS.birth,
  HEALTH: COLORS.health,
  TREATMENT: COLORS.treatment,
  BREEDING: COLORS.breeding,
};

export const ALERT_PRIORITY = {
  HIGH: COLORS.danger,
  MEDIUM: COLORS.warning,
  LOW: COLORS.info,
};
