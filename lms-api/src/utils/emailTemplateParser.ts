export function parseTemplate(content: string, params: { [key: string]: any }): string {
  let result = content;

  // Replace [key] placeholders (e.g., [module_name], [firstName])
  result = result.replace(/\[([^\]]+)\]/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });

  // Replace {key} placeholders (e.g., {otp})
  result = result.replace(/\{([^\}]+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });

  return result;
}

export function resolveSubject(templateSubject: string, customSubject?: string): string {
  if (!customSubject) return templateSubject;

  // If customSubject contains key:value pairs, parse them
  if (customSubject.includes(':')) {
    const params: { [key: string]: string } = {};
    customSubject.split(',').forEach((pair) => {
      const [key, value] = pair.split(':').map((s) => s.trim());
      if (key && value) params[key] = value;
    });
    return parseTemplate(templateSubject, params);
  }

  // If customSubject is a plain string, use it directly
  return customSubject;
}