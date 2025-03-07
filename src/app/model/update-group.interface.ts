export interface UpdateGroup {
  groupId: number;
  groupName: string;
  members: number[];
  memberRoles: [
    {
      personId: number;
      roles: number[];
    }
  ];
}
