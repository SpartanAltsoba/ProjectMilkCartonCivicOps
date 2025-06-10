export interface IStakeholder {
  id: string;
  name: string;
  type: string;
  influence?: number;
}

export interface IRelationship {
  id: string;
  from: string;
  to: string;
  type: string;
  strength?: number;
}
