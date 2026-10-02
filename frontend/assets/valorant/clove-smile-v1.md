# 暮蝶点击表情素材

- 输出：`clove-smile-v1.png`（1369 × 1149，RGBA）。
- 模式：内置 imagegen 编辑工具。
- 输入：`character-01-fx.png`。
- 网页只显示生成图的脸部区域，身体、头发外轮廓、武器和蝴蝶继续使用原图。
- 点击暮蝶切换闭眼微笑，再点恢复原表情。
- 实现：`js/valorant-art.js`。蝴蝶、两枚飞镖由原图坐标遮罩分离；遮罩同时从底图隐藏对应部件，避免重影。刀光仅叠加青色像素上的轻扫光。
- 修改前静态版：`site/_backups/valorant-before-local-motion-20260924/`（main.js、sections.css、index.html）。

## 生成提示词（原文）

Use case: precise-object-edit. Edit target: the provided transparent pixel-art full-body Clove character sprite. Create ONE alternate expression of this EXACT sprite for a click-to-toggle web animation. Change ONLY the facial expression inside the existing face: both eyes gently closed in a cute happy crescent smile, small cheerful smiling mouth, soft pink cheeks. Keep original pixel-art block size and crisp black pixel outlines. Keep the exact original head angle, face outline, hair, all hair clips, body, outfit, sword, hands, legs, shoes, blue butterfly and little accents, their geometry and every placement completely unchanged. Keep exact same full canvas composition, character size and position; do NOT recenter, zoom, rotate, crop, or add anything. Original canvas 1369 x 1149; preserve aspect ratio. Real transparent alpha background. The image will be aligned with the original and only the interior of the face will be shown. No text, no new symbols, no face obscuring additions.
