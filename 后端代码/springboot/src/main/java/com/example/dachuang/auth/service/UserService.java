package com.example.dachuang.auth.service;

import com.example.dachuang.auth.entity.User;
import com.example.dachuang.auth.repository.UserRepository;
import com.example.dachuang.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new BusinessException(400, "Username already exists");
        }
        // In a real app, password should be hashed here.
        // For this demo, we store plain text or simple hash as per previous pattern.
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword("123456"); // Default password
        }
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "User not found"));

        user.setNickname(userDetails.getNickname());
        user.setRole(userDetails.getRole());
        user.setPhone(userDetails.getPhone());
        user.setName(userDetails.getName());

        // Only update password if provided and not empty
        if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
            user.setPassword(userDetails.getPassword());
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
