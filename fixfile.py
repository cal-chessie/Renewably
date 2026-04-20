import os

p = 'src/app/crm/companies/[id]/page.tsx'
fpath = os.path.join('/home/z/my-project', p)
lines = open(fpath, 'r').readlines()

out = []
for i, line in enumerate(lines):
    if '{/* Responsive override */}' in line and i > 700:
        break
    out.append(line)

out.append('\n        {/* Responsive override */}\n')
out.append('        <style>{".company-grid{grid-template-columns:1fr 1fr!important}@media(max-width:900px){.company-grid{grid-template-columns:1fr!important}}"}</style>\n')
out.append('      </motion.div>\n')
out.append('    </div>\n')
out.append('  )\n')
out.append('}\n')

open(fpath, 'w').writelines(out)
print('Fixed - wrote', len(out), 'lines')
