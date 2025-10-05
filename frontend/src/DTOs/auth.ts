export interface UserDto {
    id: string;
    username: string;
    email: string;
    avatar?: string;
}

export interface AuthResponseDto {
    token: string;
    user: UserDto;
}
