/**
 * 计算两个字符串的相似度 (Levenshtein距离算法)
 * @param str1 第一个字符串
 * @param str2 第二个字符串
 * @returns 相似度百分比 (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0) return str2.length === 0 ? 1 : 0
  if (str2.length === 0) return 0

  const matrix: number[][] = []

  // 初始化矩阵
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  // 填充矩阵
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1, // 插入
          matrix[i - 1][j] + 1 // 删除
        )
      }
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return (maxLength - matrix[str2.length][str1.length]) / maxLength
}

/**
 * 模糊匹配函数，检查用户输入是否与答案匹配（>50%相似度）
 * @param userInput 用户输入
 * @param correctAnswers 正确答案数组
 * @param threshold 匹配阈值，默认0.5 (50%)
 * @returns 是否匹配成功
 */
export function fuzzyMatch(
  userInput: string,
  correctAnswers: string[],
  threshold: number = 0.5
): boolean {
  if (!userInput || !correctAnswers || correctAnswers.length === 0) {
    return false
  }

  const normalizedInput = userInput.trim().toLowerCase()

  // 检查每个正确答案
  for (const answer of correctAnswers) {
    const normalizedAnswer = answer.trim().toLowerCase()

    // 完全匹配
    if (normalizedInput === normalizedAnswer) {
      return true
    }

    // 模糊匹配
    const similarity = calculateSimilarity(normalizedInput, normalizedAnswer)
    if (similarity >= threshold) {
      return true
    }

    // 包含匹配（对于较长的答案）
    if (normalizedAnswer.length > 3) {
      if (
        normalizedInput.includes(normalizedAnswer) ||
        normalizedAnswer.includes(normalizedInput)
      ) {
        return true
      }
    }
  }

  return false
}

/**
 * 获取最佳匹配的相似度
 * @param userInput 用户输入
 * @param correctAnswers 正确答案数组
 * @returns 最高相似度
 */
export function getBestMatchSimilarity(userInput: string, correctAnswers: string[]): number {
  if (!userInput || !correctAnswers || correctAnswers.length === 0) {
    return 0
  }

  const normalizedInput = userInput.trim().toLowerCase()
  let maxSimilarity = 0

  for (const answer of correctAnswers) {
    const normalizedAnswer = answer.trim().toLowerCase()
    const similarity = calculateSimilarity(normalizedInput, normalizedAnswer)
    maxSimilarity = Math.max(maxSimilarity, similarity)
  }

  return maxSimilarity
}
