package com.library.service;

import com.library.entity.Notification;
import com.library.entity.Role;
import com.library.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;

public interface UserService {
    Page<User> getUsers(String keyword, Role role, int page, int size, String sortBy, String sortDir);
    User getUserById(Long id);
    User getUserByEmail(String email);
    User createUser(User user);
    User updateUser(Long id, User user);
    void deleteUser(Long id);
    List<Notification> getUserNotifications(Long userId);
}
