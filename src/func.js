import { exprToSQL } from './expr'
import { commonTypeValue, hasVal, identifierToSql, toUpper } from './util'
import { overToSQL } from './over'

function anyValueFuncToSQL(stmt) {
  const { args, type, over } = stmt
  const { expr, having } = args
  let sql = `${toUpper(type)}(${exprToSQL(expr)}`
  if (having) sql = `${sql} HAVING ${toUpper(having.prefix)} ${exprToSQL(having.expr)}`
  sql = `${sql})`
  const overStr = overToSQL(over)
  return [sql, overStr].filter(hasVal).join(' ')
}

function arrayDimensionToSymbol(target) {
  if (!target || !target.array) return ''
  switch (target.array) {
    case 'one':
      return '[]'
    case 'two':
      return '[][]'
  }
}

function castToSQL(expr) {
  const { collate, target, expr: expression, keyword, symbol, as: alias, tail } = expr
  const { length, dataType, parentheses, quoted, scale, suffix: dataTypeSuffix } = target
  let str = ''
  if (length != null) str = scale ? `${length}, ${scale}` : length
  if (parentheses) str = `(${str})`
  if (dataTypeSuffix && dataTypeSuffix.length) str += ` ${dataTypeSuffix.join(' ')}`
  let prefix = exprToSQL(expression)
  let symbolChar = '::'
  let suffix = ''
  if (symbol === 'as') {
    prefix = `${toUpper(keyword)}(${prefix}`
    suffix = ')'
    symbolChar = ` ${symbol.toUpperCase()} `
  }
  if (tail) suffix += ` ${tail.operator} ${exprToSQL(tail.expr)}`
  if (alias) suffix += ` AS ${identifierToSql(alias)}`
  if (collate) suffix += ` ${commonTypeValue(collate).join(' ')}`
  const arrayDimension = arrayDimensionToSymbol(target)
  const result = [prefix, symbolChar, quoted, dataType, quoted, arrayDimension, str, suffix]
  return result.filter(hasVal).join('')
}

function extractFunToSQL(stmt) {
  const { args, type } = stmt
  const { field, cast_type: castType, source } = args
  const result = [`${toUpper(type)}(${toUpper(field)}`, 'FROM', toUpper(castType), exprToSQL(source)]
  return `${result.filter(hasVal).join(' ')})`
}

function funcToSQL(expr) {
  const { args, name, args_parentheses, parentheses, over, collate, suffix } = expr
  const collateStr = commonTypeValue(collate).join(' ')
  const overStr = overToSQL(over)
  const suffixStr = exprToSQL(suffix)
  if (!args) return [name, overStr].filter(hasVal).join(' ')
  let separator = expr.separator || ', '
  if (toUpper(name) === 'TRIM') separator = ' '
  let str = [name]
  str.push(args_parentheses === false ? ' ' : '(')
  str.push(exprToSQL(args).join(separator))
  if (args_parentheses !== false) str.push(')')
  str = [str.join(''), suffixStr].filter(hasVal).join(' ')
  return [parentheses ? `(${str})` : str, collateStr, overStr].filter(hasVal).join(' ')
}

export {
  anyValueFuncToSQL,
  castToSQL,
  extractFunToSQL,
  funcToSQL,
}
