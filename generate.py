import os
os.chdir('c:/Users/abhinav__mg/Downloads/ott release')
html = open('index.html', encoding='utf-8').read()
css = open('css/styles.css', encoding='utf-8').read()
js1 = open('js/api.js', encoding='utf-8').read()
js2 = open('js/ui.js', encoding='utf-8').read()
js3 = open('js/app.js', encoding='utf-8').read()

html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="js/api.js"></script>', '<script>\n' + js1 + '\n</script>')
html = html.replace('<script src="js/ui.js"></script>', '<script>\n' + js2 + '\n</script>')
html = html.replace('<script src="js/app.js"></script>', '<script>\n' + js3 + '\n</script>')

open('FINAL_SITE.html', 'w', encoding='utf-8').write(html)
