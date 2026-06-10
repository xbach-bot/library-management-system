package com.library.service;

import com.library.dto.AuthRequest;
import com.library.dto.AuthResponse;
import com.library.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(AuthRequest request);
    void register(RegisterRequest request);
}
