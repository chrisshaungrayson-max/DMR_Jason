export interface UserInfo {
  name: string;
  age: string;
  sex: 'male' | 'female' | 'other' | '';
  height: string;
  weight: string;
  profilePicture?: string;
  phoneNumber?: string;
  email: string;
  date: string;
  useMetricUnits: boolean;
  useDarkMode?: boolean;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
}
