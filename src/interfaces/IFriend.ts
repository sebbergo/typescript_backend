export enum Gender {
  MALE,
  FEMALE,
  OTHER,
}

export interface IFriend {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender?: Gender;
  age?: Number;
  role?: string;
}
