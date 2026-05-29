import re

with open('/Users/houhuazhu/Downloads/大创比赛/dachuang/2.0/前端代码/miniprogram-5/src/pages/index/index.wxss', 'r', encoding='utf-8') as f:
    index_css = f.read()

with open('/Users/houhuazhu/Downloads/大创比赛/dachuang/2.0/前端代码/miniprogram-5/src/app.wxss', 'r', encoding='utf-8') as f:
    app_css = f.read()


extract_start = index_css.find('.page-aura {')
extract_end = index_css.find('.trace-card {')

extracted = index_css[extract_start:extract_end]


nav_ghost = """
.nav-ghost {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10rpx 24rpx rgba(27, 28, 21, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-ghost-arrow {
  margin-top: -4rpx;
  font-size: 42rpx;
  line-height: 1;
  color: var(--primary-deep);
}
"""

new_global_css = "/* --- UNIFIED PREMIUM HERB GLOBAL COMPONENTS --- */\n" + extracted + nav_ghost + "\n/* --- END UNIFIED COMPONENTS --- */\n"


new_index_css = index_css[:extract_start] + index_css[extract_end:]
with open('/Users/houhuazhu/Downloads/大创比赛/dachuang/2.0/前端代码/miniprogram-5/src/pages/index/index.wxss', 'w', encoding='utf-8') as f:
    f.write(new_index_css)


ops_start = app_css.find('.ops-page {')
ops_end_str = '.form-shell {'
form_end_str = '.form-single-action {'

form_shell_start = app_css.find(form_end_str)

if form_shell_start != -1:
    block_end = app_css.find('}', form_shell_start) + 1
else:
    block_end = -1

if ops_start != -1 and block_end != -1:
    app_css = app_css[:ops_start] + new_global_css + app_css[block_end:]
else:
    app_css = app_css + "\n" + new_global_css


with open('/Users/houhuazhu/Downloads/大创比赛/dachuang/2.0/前端代码/miniprogram-5/src/app.wxss', 'w', encoding='utf-8') as f:
    f.write(app_css)

print("Extraction complete.")
