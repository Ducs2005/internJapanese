# Penalty Tracker

Ứng dụng mobile-first cho nhóm 7 người: ghi phạt, xem thống kê và lịch sử người thao tác. Frontend HTML/CSS/JavaScript thuần chạy trên GitHub Pages; Firebase Authentication quản lý đăng nhập, Realtime Database lưu dữ liệu.

## Thiết lập Firebase lần đầu

1. Trong Firebase Console → **Authentication → Sign-in method**, bật **Email/Password**.
2. Trong **Authentication → Users**, tạo 7 tài khoản email/password. Username và email tương ứng được khai báo trong `users.js`; mật khẩu chỉ nhập trong Firebase Console và màn hình đăng nhập, không lưu vào repository.
3. Trong **Authentication → Settings → Authorized domains**, thêm `ducs2005.github.io`. Thêm `localhost` nếu cần chạy thử tại máy.
4. Trong **Realtime Database → Rules**, thay rules hiện tại bằng:

```json
{
  "rules": {
    "penalties": {
      ".read": "auth != null",
      "$eventId": {
        ".write": "auth != null && !data.exists() && newData.child('createdByUid').val() == auth.uid"
      }
    }
  }
}
```

Quy tắc trên cho phép mọi tài khoản đã đăng nhập đọc lịch sử và chỉ tạo sự kiện mới với UID đúng tài khoản đang đăng nhập; không cho sửa/xoá sự kiện đã ghi. Không để rules cũ ở root (`.read: true`, `.write: true`), vì rules cấp trên sẽ tiếp tục mở quyền.

## Tài khoản cố định

`users.js` là danh sách ánh xạ username → email → tên hiển thị, không chứa password. Tạo tài khoản với email khớp danh sách dưới đây trong Firebase Authentication:

| Username | Email đăng nhập | Tên trong lịch sử |
| --- | --- | --- |
| `duc` | `duc@internjapanese.app` | Đức |
| `anhvy` | `anhvy@internjapanese.app` | Ánh Vy |
| `thuan` | `thuan@internjapanese.app` | Thuận |
| `thaovy` | `thaovy@internjapanese.app` | Thảo Vy |
| `hue` | `hue@internjapanese.app` | Huệ |
| `tinh` | `tinh@internjapanese.app` | Tỉnh |
| `quyen` | `quyen@internjapanese.app` | Quyên |

Firebase Authentication là nơi lưu thông tin đăng nhập; `users.js` không lưu mật khẩu vì GitHub Pages công khai mã nguồn. Người dùng có thể đổi mật khẩu trong mục **Đổi mật khẩu**; thao tác nhập mật khẩu hiện tại để xác thực lại trước khi cập nhật. Firebase Auth giữ phiên đăng nhập cục bộ trên trình duyệt cho đến khi người dùng đăng xuất.

## Chạy thử

ES module không chạy khi mở `index.html` bằng `file://`. Từ thư mục project chạy:

```bash
python -m http.server 8000
```

Mở `http://localhost:8000` và dùng tài khoản đã tạo trong Authentication.

## Deploy lên GitHub Pages

Đẩy các file lên nhánh GitHub Pages, chờ Actions/Pages deploy xong rồi mở URL trang. Mỗi lần phạt được lưu tại `/penalties/{push-id}` gồm `memberId`, `memberName`, `amount`, `timestamp`, `createdByUid`, `createdByName`. Các sự kiện cũ chưa có tên người bấm sẽ hiện “Tài khoản cũ”.

## Tuỳ chỉnh

- Sửa thành viên ở đầu `app.js` và ánh xạ tài khoản trong `users.js`.
- Sửa `FINE_AMOUNT` trong `app.js` để thay tiền phạt.
- Lịch sử hiển thị tối đa 20 mục ban đầu; bấm **Xem tất cả** để mở toàn bộ.
