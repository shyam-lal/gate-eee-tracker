import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize line endings
content = content.replace('\r\n', '\n')

start_marker = '''    return (
      <div className="min-h-screen bg-transparent text-surface-400 font-sans p-4 md:p-8 pb-32 selection:bg-primary-500/30">

        {(editingLog) && ('''

new_start = '''    return null;
  };

  const renderPopups = () => (
    <>
        {(editingLog) && ('''

if start_marker in content:
    content = content.replace(start_marker, new_start)
else:
    print('Start marker not found')

dashboard_pattern = re.compile(r'        \{/\* DASHBOARD CONTENT \*/\}.*?        \{/\* QUICK LOG MODAL \*/\}', re.DOTALL)
if dashboard_pattern.search(content):
    content = dashboard_pattern.sub('        {/* QUICK LOG MODAL */}', content)
else:
    print('Dashboard pattern not found')

end_marker = '''      </div>
    );
  };

  const isAuthView ='''

new_end = '''    </>
  );

  const isAuthView ='''

if end_marker in content:
    content = content.replace(end_marker, new_end)
else:
    print('End marker not found')

app_return_marker = '''              {renderCurrentView()}
              {focusOverlay}
          </AppLayout>'''

new_app_return = '''              {renderCurrentView()}
              {renderPopups()}
              {focusOverlay}
          </AppLayout>'''

if app_return_marker in content:
    content = content.replace(app_return_marker, new_app_return)
else:
    print('App return marker not found')

app_return_marker_2 = '''      {renderCurrentView()}
      {focusOverlay}
    </>'''

new_app_return_2 = '''      {renderCurrentView()}
      {renderPopups()}
      {focusOverlay}
    </>'''

if app_return_marker_2 in content:
    content = content.replace(app_return_marker_2, new_app_return_2)
else:
    print('App return marker 2 not found')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done script')
