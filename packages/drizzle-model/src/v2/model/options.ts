export interface ModelOptions {
  format?: () => void;

  insertSchema?: any;
  updateSchema?: any;

  methods?: Record<string, any>;
}
