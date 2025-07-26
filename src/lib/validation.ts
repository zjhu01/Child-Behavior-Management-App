// 表单验证工具函数

/**
 * 验证手机号格式
 */
export const validatePhone = (phone: string): boolean => {
  // 更准确的中国手机号正则表达式
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: '密码长度至少6位' }
  }
  
  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过20位' }
  }
  
  // 检查是否包含至少一个字母和一个数字（可选的强度要求）
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: '密码应包含字母和数字' }
  }
  
  return { isValid: true, message: '' }
}

/**
 * 验证年龄
 */
export const validateAge = (age: string | number): { isValid: boolean; message: string } => {
  const ageNum = typeof age === 'string' ? parseInt(age) : age
  
  if (isNaN(ageNum)) {
    return { isValid: false, message: '请输入有效的年龄' }
  }
  
  if (ageNum < 1 || ageNum > 18) {
    return { isValid: false, message: '年龄应在1-18岁之间' }
  }
  
  return { isValid: true, message: '' }
}

/**
 * 验证昵称
 */
export const validateNickname = (nickname: string): { isValid: boolean; message: string } => {
  if (!nickname.trim()) {
    return { isValid: false, message: '请输入昵称' }
  }
  
  if (nickname.length < 2) {
    return { isValid: false, message: '昵称至少2个字符' }
  }
  
  if (nickname.length > 20) {
    return { isValid: false, message: '昵称不能超过20个字符' }
  }
  
  // 检查是否包含特殊字符
  const specialChars = /[<>\"'&]/
  if (specialChars.test(nickname)) {
    return { isValid: false, message: '昵称不能包含特殊字符' }
  }
  
  return { isValid: true, message: '' }
}

/**
 * 验证文件类型和大小
 */
export const validateFile = (
  file: File, 
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): { isValid: boolean; message: string } => {
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: `只支持 ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join('、')} 格式的文件` 
    }
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { isValid: false, message: `文件大小不能超过${maxSizeMB}MB` }
  }
  
  return { isValid: true, message: '' }
}

/**
 * 清理和转义用户输入
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // 移除潜在的XSS字符
    .substring(0, 1000) // 限制长度
}

/**
 * 验证积分值
 */
export const validateScore = (score: number): { isValid: boolean; message: string } => {
  if (score === 0) {
    return { isValid: false, message: '请设置积分变化' }
  }
  
  if (score < -50 || score > 50) {
    return { isValid: false, message: '积分变化应在-50到50之间' }
  }
  
  return { isValid: true, message: '' }
}
