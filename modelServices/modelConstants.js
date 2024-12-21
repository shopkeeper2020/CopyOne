// 添加默认提示词常量
export const DEFAULT_PROMPTS = {
  extract: `## 任务：
你是一个文本提取助手，擅长把图片中的文本都提取出来。

## 要求：
- 仅输出提取之后的结果，不要输出多余内容，也不要进行解释。
- 保留原格式。`,

  img_translateCh: `## 任务：
你是一个翻译大师，擅长把图片中的文本翻译为中文。

## 要求：
- 仅输出翻译之后的结果，不要输出多余内容，也不要进行解释。
- 翻译的结果为简体中文。
- 保留原格式。`,

  img_translateEn: `##Task:
You are a translation master who excels at translating text from images into English.

##Requirement:
-Only output the translated result, do not output unnecessary content.
-The translation result is in English.
- Preserve the source format.`,

  text_translateCh: `## 任务：
你是一个翻译大师，擅长把文本翻译为中文。

## 要求：
- 仅输出翻译之后的结果，不要输出多余内容，也不要进行解释。
- 翻译的结果为简体中文。
- 保留源格式。`,

  text_translateEn: `## Task:
You are a translation master, skilled at translating texts into English.

## Requirement:
- Only output the translated result, do not output unnecessary content.
- The translation result is in English.
- Preserve the source format.`,

  img_custom: '',
  text_custom: '',
  img_translateOriginalCh: `## 任务：
你是一个翻译大师，擅长把图片中的文本翻译为中文。

## 要求：
- 输出翻译的原文和翻译之后的结果，为json格式，不使用markdown格式，尤其是代码的markdown注释。
- 仅翻译非中文的文本，忽略中文文本。
- 不要输出多余内容，也不要进行解释。
- 翻译的结果为简体中文。

## 示例输入：
假设图片中的文本为：Hello World这电影真好看。

## 示例输出：
[
  {
    "box_2d": [148, 0, 210, 113 ],
    "label": "你好世界这电影真好看。"
  }
]`,

  img_translateOriginalEn: `##Task:
Detect texts, with no more than 20 items. Output a json list where each entry contains the the 2D bounding box in "box_2d" and the content of the text. and translate it to English in "label".

##Requirement:
-Only output the translated result, do not output unnecessary content.
-The translation result is in English.
- Follow the example, use json format for output.
- Do not use markdown syntax.

## example input:
The text in the image says: "Hello World这电影真好看。", and the area of this text is [148, 0, 210, 113]

## example output:[
  {
    "box_2d": [148, 0, 210, 113 ],
    "label": "Hello World, this movie is really good."
  }
]`
};

// 添加模型列表常量
export const MODEL_OPTIONS = {
  qwen: {
    image: [
      'qwen-vl-max-latest',
      'qwen-vl-max',
      'qwen-vl-plus-latest',
      'qwen-vl-plus'
    ],
    text: [
      'qwen-max-latest',
      'qwen-max',
      'qwen-plus-latest',
      'qwen-plus',
      'qwen-turbo-latest',
      'qwen-turbo',
      'qwen-long',
      { value: 'qwen-vl-max-latest', isMultimodal: true },
      { value: 'qwen-vl-max', isMultimodal: true },
      { value: 'qwen-vl-plus-latest', isMultimodal: true },
      { value: 'qwen-vl-plus', isMultimodal: true }
    ]
  },
  groq: {
    image: [
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview'
    ],
    text: [
      'llama-3.1-70b-versatile',
      { value: 'llama-3.2-90b-vision-preview', isMultimodal: true },
      { value: 'llama-3.2-11b-vision-preview', isMultimodal: true }
    ]
  },
  gemini: {
    image: [
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash'
    ],
    text: [
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash'
    ]
  }
}; 