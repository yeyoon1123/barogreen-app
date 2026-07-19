package com.example.demo.controller.dto;

import java.util.List;

public class PagedResponse<T> {
    private List<T> items;
    private int total;
    private int page;
    private int size;

    public PagedResponse() {}

    public PagedResponse(List<T> items, int total, int page, int size) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
    }

    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}
