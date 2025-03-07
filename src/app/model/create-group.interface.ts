export interface CreateGroup {
  groupName: string;
  members: number[];
  memberRoles: [
    {
      personId: number;
      roles: number[];
    }
  ];
}
