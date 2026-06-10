package com.library.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BorrowRequest {

    @NotNull(message = "Độc giả không được để trống")
    private Long userId;

    @NotEmpty(message = "Danh sách sách mượn không được để trống")
    private List<Long> bookIds;

    // Số ngày mượn mặc định, ví dụ 14 ngày
    private Integer borrowDays = 14;
}
