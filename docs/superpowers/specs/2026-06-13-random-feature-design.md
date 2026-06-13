# Thiết kế Tính năng Random - Quản Lý Chi Tiêu

Ngày: 2026-06-13
Chủ đề: Tính năng Random món ăn và quán ăn
Trạng thái: Chờ phê duyệt

## 1. Mục tiêu
Giúp người dùng giải quyết vấn đề "Hôm nay ăn gì?" bằng cách cung cấp công cụ chọn ngẫu nhiên món ăn hoặc quán ăn dựa trên dữ liệu cá nhân của họ.

## 2. Trải nghiệm người dùng (UX)

### A. Random Món ăn
- Vị trí: Icon 🎲 (dice) đặt cạnh tiêu đề "Danh sách món ăn".
- Hành động: Khi nhấn vào, hệ thống chọn ngẫu nhiên một món trong danh sách món của user.
- Phản hồi: Tự động cuộn và chọn món đó ở cột bên trái, hiển thị danh sách quán tương ứng ở cột bên phải.

### B. Random Quán ăn
- Vị trí: Icon 🎲 (dice) đặt cạnh nút "Thêm quán" trong phần chi tiết món.
- Điều kiện: Chỉ hoạt động khi một món đã được chọn.
- Hành động: 
    - Nếu đã chọn món: Chọn ngẫu nhiên một quán trong danh sách quán của món đó.
    - Nếu chưa chọn món: Hiển thị thông báo yêu cầu người dùng chọn món trước.
- Phản hồi: Hiển thị một Modal "Kết quả Random" với thông tin quán (Tên, địa chỉ, review).

## 3. Kiến trúc kỹ thuật

### Thành phần giao diện (React)
- Cập nhật `src/components/restaurants/RestaurantsPage.tsx`:
    - Thêm state `randomResult` để lưu thông tin quán được chọn ngẫu nhiên.
    - Thêm hàm `handleRandomDish()`: 
        - Chọn index ngẫu nhiên trong mảng `dishes`.
        - Cập nhật `selectedDishId`.
    - Thêm hàm `handleRandomRestaurant()`:
        - Kiểm tra `selectedDish`.
        - Nếu có, chọn index ngẫu nhiên trong `selectedDish.dish_restaurants`.
        - Hiển thị Modal kết quả.

### Modal Kết quả (RandomResultModal)
- Một component mới (hoặc inline trong RestaurantsPage) hiển thị:
    - Tên quán (font lớn, nổi bật).
    - Địa chỉ (kèm icon map-pin).
    - Review (nếu có).
    - Nút "Thử lại" (Random lại quán khác của món đó).
    - Nút "Đóng".

## 4. Ràng buộc & Xử lý lỗi
- Danh sách trống: Nếu chưa có món/quán nào, icon random sẽ bị ẩn hoặc disabled.
- Chỉ có 1 mục: Vẫn hoạt động nhưng kết quả sẽ luôn là mục đó.

## 5. Kế hoạch kiểm thử
- Kiểm tra random món: Đảm bảo index được chọn nằm trong phạm vi mảng.
- Kiểm tra random quán: Đảm bảo không lỗi khi danh sách quán trống.
- Kiểm tra UI: Các icon 🎲 hiển thị đúng vị trí và phản hồi tốt trên mobile/desktop.
