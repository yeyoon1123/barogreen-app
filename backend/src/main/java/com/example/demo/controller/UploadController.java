// src/main/java/com/example/demo/controller/UploadController.java
package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
public class UploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(uploadDir).toAbsolutePath().normalize());
    }

    @PostMapping(value = "/api/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(@RequestPart("file") MultipartFile file, HttpServletRequest req) throws IOException {
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (ext == null || ext.isBlank()) ext = "jpg";
        String filename = UUID.randomUUID() + "." + ext.toLowerCase();

        Path dest = Paths.get(uploadDir).resolve(filename).toAbsolutePath().normalize();
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        String base = String.format("%s://%s:%d", req.getScheme(), req.getServerName(), req.getServerPort());
        String url = base + "/uploads/" + filename;

        return Map.of("url", url);
    }
}
