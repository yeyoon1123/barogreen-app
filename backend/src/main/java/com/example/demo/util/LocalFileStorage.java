package com.example.demo.util;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
public class LocalFileStorage {
    private final Path root = Paths.get("C:/upload");

    public String save(MultipartFile file) throws Exception {
        if (!Files.exists(root)) Files.createDirectories(root);
        String ext = "";
        String name = file.getOriginalFilename();
        if (name != null && name.contains(".")) {
            ext = name.substring(name.lastIndexOf("."));
        }
        String fname = UUID.randomUUID() + ext;
        Path dst = root.resolve(fname);
        Files.copy(file.getInputStream(), dst);
        return "/files/" + fname;
    }
}
