package com.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookDTO {
    private Long id;

    @NotBlank(message = "Tên sách không được để trống")
    private String title;

    @NotBlank(message = "Tác giả không được để trống")
    private String author;

    @NotBlank(message = "Mã ISBN không được để trống")
    private String isbn;

    @NotBlank(message = "Nhà xuất bản không được để trống")
    private String publisher;

    @NotNull(message = "Thể loại không được để trống")
    private Long categoryId;
    
    private String categoryName;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 0, message = "Số lượng phải lớn hơn hoặc bằng 0")
    private Integer quantity;

    private Integer availableQuantity;

    private String description;

    private String coverImage;
}
