export interface AddGroupMemberData {
  userId: string;
  role: 'groupLeader' | 'subscriber';
}

export interface BulkAddGroupMembersData {
  groupId: string;
  members: {
    userId: string;
    role: 'groupLeader' | 'subscriber';
  }[];
}

export interface CreateGroupMemberData {
  groupId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
    role: 'groupLeader' | 'subscriber';
  };
}

export interface BulkCreateGroupMembersData {
  groupId: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
    signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
    role: 'groupLeader' | 'subscriber';
  }[];
}

