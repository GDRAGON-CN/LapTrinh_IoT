// Dùng chung cho trang Data Sensor và History: kiểm tra và so khớp thời gian người dùng nhập

const MESSAGE =
  'Invalid time. Use DD/MM/YYYY, HH:mm, HH:mm:ss or DD/MM/YYYY HH:mm:ss'

// Kiểm tra "text" có đúng "length" chữ số không (ví dụ "06" có 2 chữ số)
function isDigits(text, length) {
  if (text.length !== length) {
    return false
  }
  for (let i = 0; i < text.length; i++) {
    if (text[i] < '0' || text[i] > '9') {
      return false
    }
  }
  return true
}

// Kiểm tra ngày: DD/MM/YYYY hoặc YYYY-MM-DD
function isDate(part) {
  let pieces = part.split('/')
  if (pieces.length === 3) {
    if (!isDigits(pieces[0], 2) || !isDigits(pieces[1], 2)) return false
    if (!isDigits(pieces[2], 4)) return false
    if (Number(pieces[0]) < 1 || Number(pieces[0]) > 31) return false
    if (Number(pieces[1]) < 1 || Number(pieces[1]) > 12) return false
    return true
  }

  pieces = part.split('-')
  if (pieces.length === 3) {
    if (!isDigits(pieces[0], 4) || !isDigits(pieces[1], 2)) return false
    if (!isDigits(pieces[2], 2)) return false
    if (Number(pieces[1]) < 1 || Number(pieces[1]) > 12) return false
    if (Number(pieces[2]) < 1 || Number(pieces[2]) > 31) return false
    return true
  }

  return false
}

// Kiểm tra giờ: HH:mm hoặc HH:mm:ss
function isTime(part) {
  const pieces = part.split(':')
  if (pieces.length < 2 || pieces.length > 3) return false
  if (!isDigits(pieces[0], 2) || !isDigits(pieces[1], 2)) return false
  if (Number(pieces[0]) > 23 || Number(pieces[1]) > 59) return false
  if (pieces.length === 3) {
    if (!isDigits(pieces[2], 2) || Number(pieces[2]) > 59) return false
  }
  return true
}

// Trả về '' nếu hợp lệ (hoặc để trống), ngược lại trả về câu báo lỗi
export function checkTimeText(text) {
  const clean = text.trim()
  if (clean === '') {
    return ''
  }

  const parts = clean.split(' ')
  if (parts.length === 1 && (isDate(parts[0]) || isTime(parts[0]))) {
    return ''
  }
  if (parts.length === 2 && isDate(parts[0]) && isTime(parts[1])) {
    return ''
  }
  return MESSAGE
}

// Bản ghi có khớp thời gian người dùng nhập không?
// time có dạng "2026-10-06 16:22:58"; so với cả dạng "06/10/2026 16:22:58"
export function timeMatches(time, text) {
  const vnTime =
    time.slice(8, 10) +
    '/' +
    time.slice(5, 7) +
    '/' +
    time.slice(0, 4) +
    ' ' +
    time.slice(11)
  return time.includes(text) || vnTime.includes(text)
}
