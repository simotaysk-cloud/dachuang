package com.example.dachuang.trace.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class IndexController {
    /**
     * 自动跳转到管理后台
     * 强制使用相对路径，避免跳转到 127.0.0.1
     */
    @GetMapping("/")
    public String index(HttpServletRequest request) {
        return "redirect:admin/index.html";
    }
}
