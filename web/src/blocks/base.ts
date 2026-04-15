export type BlockCategory =
  | 'start'
  | 'input'
  | 'logic'
  | 'decision'
  | 'execution'
  | 'risk';

export type BlockShape = 'hat' | 'stack' | 'c-block' | 'boolean' | 'value';

export type PortDirection = 'in' | 'out';
export type PortKind =
  | 'statement'
  | 'value'
  | 'boolean'
  | 'trigger'
  | 'signal'
  | 'child';

export type ValueType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'asset'
  | 'signal'
  | 'duration'
  | 'source'
  | 'enum'
  | 'object';

export interface PortSpec {
  name: string;
  direction: PortDirection;
  kind: PortKind;
  valueType?: ValueType;
  required: boolean;
  multiple?: boolean;
}

export interface ChildSlotSpec {
  name: string;
  multiple: boolean;
}

export interface BlockSpec {
  type: string;
  category: BlockCategory;
  shape: BlockShape;
  inputPorts: PortSpec[];
  outputPorts: PortSpec[];
  childSlots?: ChildSlotSpec[];
}

export abstract class Block {
  abstract readonly type: string;
  abstract readonly category: BlockCategory;
  abstract readonly shape: BlockShape;

  getSpec(): BlockSpec {
    return {
      type: this.type,
      category: this.category,
      shape: this.shape,
      inputPorts: [],
      outputPorts: [],
      childSlots: [],
    };
  }
}
