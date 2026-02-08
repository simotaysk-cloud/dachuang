package com.example.dachuang.controller;

import com.example.dachuang.common.api.Result;
import com.example.dachuang.common.exception.BusinessException;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    // Demo-only local file storage.
    private static final Path UPLOAD_DIR = Paths.get("uploads");

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<Map<String, Object>> upload(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "Empty file");
        }

        String original = file.getOriginalFilename();
        String ext = "";
        if (StringUtils.hasText(original) && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
            if (ext.length() > 10) {
                ext = "";
            }
        }

        try {
            Files.createDirectories(UPLOAD_DIR);
            String name = UUID.randomUUID().toString().replace("-", "") + ext;
            Path dest = UPLOAD_DIR.resolve(name).normalize();
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            Map<String, Object> data = new HashMap<>();
            data.put("url", "/uploads/" + name);
            data.put("name", original == null ? "" : original);
            data.put("size", file.getSize());
            return Result.success(data);
        } catch (IOException e) {
            throw new BusinessException(500, "Upload failed");
        }
    }
}
