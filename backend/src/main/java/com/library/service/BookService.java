package com.library.service;

import com.library.dto.BookDTO;
import org.springframework.data.domain.Page;

public interface BookService {
    Page<BookDTO> getBooks(String keyword, Long categoryId, int page, int size, String sortBy, String sortDir);
    BookDTO getBookById(Long id);
    BookDTO createBook(BookDTO bookDTO);
    BookDTO updateBook(Long id, BookDTO bookDTO);
    void deleteBook(Long id);
}
