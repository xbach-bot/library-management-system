package com.library.controller;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Xem thông tin cá nhân người dùng đang đăng nhập
    @GetMapping("/profile")
    public ResponseEntity<User> getCurrentUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(user);
    }

    // Xem danh sách thông báo của người dùng đang đăng nhập
    @GetMapping("/notifications")
    public ResponseEntity<java.util.List<com.library.entity.Notification>> getCurrentUserNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getUserNotifications(user.getId()));
    }

    // API quản trị người dùng (chỉ ADMIN/LIBRARIAN có quyền xem danh sách độc giả)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "role", required = false) Role role,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc") String sortDir) {
        
        Page<User> users = userService.getUsers(keyword, role, page, size, sortBy, sortDir);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<?> createUser(@RequestBody User user, @AuthenticationPrincipal UserDetails currentUserDetails) {
        User currentUser = userService.getUserByEmail(currentUserDetails.getUsername());
        
        // Nếu người tạo là LIBRARIAN, chỉ cho phép tạo tài khoản có vai trò READER
        if (currentUser.getRole() == Role.LIBRARIAN && user.getRole() != Role.READER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Thủ thư (Librarian) chỉ được phép tạo tài khoản Độc giả (Reader)!"));
        }
        
        return new ResponseEntity<>(userService.createUser(user), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user, @AuthenticationPrincipal UserDetails currentUserDetails) {
        User currentUser = userService.getUserByEmail(currentUserDetails.getUsername());
        User existingUser = userService.getUserById(id);
        
        // Nếu người sửa là LIBRARIAN
        if (currentUser.getRole() == Role.LIBRARIAN) {
            // 1. Không cho phép sửa thông tin của ADMIN hoặc LIBRARIAN khác
            if (existingUser.getRole() == Role.ADMIN || existingUser.getRole() == Role.LIBRARIAN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Thủ thư không được phép sửa tài khoản của Admin hoặc Thủ thư khác!"));
            }
            // 2. Không cho phép thay đổi vai trò thành ADMIN hoặc LIBRARIAN
            if (user.getRole() != Role.READER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Thủ thư chỉ được phép thiết lập vai trò Độc giả (Reader)!"));
            }
        }
        
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        User userToDelete = userService.getUserById(id);
        if (userToDelete.getEmail().equals(currentUser.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn không thể tự xóa tài khoản của chính mình!"));
        }
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Xóa người dùng thành công!"));
    }
}
