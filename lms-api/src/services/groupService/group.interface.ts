export interface GroupFilters {
  name?: string;
  companyId?: string;
  isActive?: boolean;
  signInType?: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  gophishGroupID?: string;
  search?: string;
  page?: number;
  limit?: number;
  groupLeaderId?: string;
}

export interface CreateGroupData {
  name: string;
  companyId: string;
  signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  gophishGroupID?: string;
}

export interface CreateGroupWithLeaderData {
  name: string;
  companyId: string;
  signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  gophishGroupID?: string;
  groupLeader: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  };
}

export interface UpdateGroupData {
  name?: string;
  signInType?: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  gophishGroupID?: string;
}
