export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: 'admin' | 'resident';
  buildingId: string;
}
