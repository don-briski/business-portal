export enum Trigger {
  Manual = "Manual",
  Automatic = "Automatic",
}

export enum Comparator {
  EqualTo = "EqualTo",
  GreaterThan = "GreaterThan",
  LessThan = "LessThan",
}

export interface DecideSetup {
  autoApprove: boolean;
  trigger: Trigger;
  isActive: boolean;
  autoApproveCriteria: [
    {
      key: string;
      comparator: Comparator;
      value: number;
    }
  ];
}
