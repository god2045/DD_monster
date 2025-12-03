// 在加载数据后，初始化筛选选项
let allRegions = [];
let allTypes = [];

// 显示怪物函数
function displayMonsters(monsters) {
    const regionsDiv = document.getElementById('regions');
    
    // 记录当前展开的区域
    const expandedRegions = new Set();
    document.querySelectorAll('.region-header:not(.collapsed)').forEach(header => {
        const regionName = header.textContent.split(' (')[0];
        expandedRegions.add(regionName);
    });
    
    regionsDiv.innerHTML = '';
    
    // 按区域分组
    const monstersByRegion = {};
    monsters.forEach(monster => {
        const region = monster.region || '未知区域';
        if (!monstersByRegion[region]) {
            monstersByRegion[region] = [];
        }
        monstersByRegion[region].push(monster);
    });
    
    // 为每个区域创建折叠部分
    Object.entries(monstersByRegion).forEach(([region, regionMonsters]) => {
        const regionSection = document.createElement('div');
        regionSection.className = 'region-section';
        
        // 检查这个区域之前是否是展开状态
        const wasExpanded = expandedRegions.has(region);
        const collapsedClass = wasExpanded ? '' : 'collapsed';
        const arrowSymbol = wasExpanded ? '▲' : '▼';
        const expandedClass = wasExpanded ? 'expanded' : '';
        
        regionSection.innerHTML = `
            <div class="region-header ${collapsedClass}" onclick="toggleRegion(this)">
                <span>${region} (${regionMonsters.length})</span>
                <span class="arrow">${arrowSymbol}</span>
            </div>
            <div class="region-monsters ${expandedClass}">
                ${regionMonsters.map(monster => `
                    <div class="monster-card" onclick="showDetails('${monster.name}')">
                        <h3>${monster.name}</h3>
                        <p><strong>类型:</strong> ${monster.type || '未知'}</p>
                        <p><strong>HP:</strong> ${monster.hp || '未知'}</p>
                        <p><strong>出现回合:</strong> ${monster.spawnRound || '未知'}</p>
                    </div>
                `).join('')}
            </div>
        `;
        regionsDiv.appendChild(regionSection);
    });
    
    // 如果没有怪物，显示提示
    if (monsters.length === 0) {
        regionsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>没有找到匹配的怪物</h3>
                <p>请尝试其他搜索条件</p>
            </div>
        `;
    }
}


function toggleRegion(header) {
    const regionSection = header.parentElement;
    const monstersDiv = regionSection.querySelector('.region-monsters');
    const arrow = header.querySelector('.arrow');
    
    // 如果区域没有怪物，不允许展开
    const monsterCount = monstersDiv.querySelectorAll('.monster-card').length;
    if (monsterCount === 0 && header.classList.contains('collapsed')) {
        return;
    }
    
    if (header.classList.contains('collapsed')) {
        // 展开
        header.classList.remove('collapsed');
        monstersDiv.classList.add('expanded');
        arrow.textContent = '▲';
    } else {
        // 折叠
        header.classList.add('collapsed');
        monstersDiv.classList.remove('expanded');
        arrow.textContent = '▼';
    }
}


function expandAllRegions() {
  document.querySelectorAll(".region-header.collapsed").forEach((header) => {
    toggleRegion(header);
  });
}

function collapseAllRegions() {
  document
    .querySelectorAll(".region-header:not(.collapsed)")
    .forEach((header) => {
      toggleRegion(header);
    });
}

// 筛选怪物函数
function filterMonsters() {
    if (!window.monstersData) return;
    
    const searchText = document.getElementById('search').value.toLowerCase();
    const selectedRegion = document.getElementById('region-filter').value;
    const selectedType = document.getElementById('type-filter').value;
    
    // 筛选怪物
    const filteredMonsters = window.monstersData.filter(monster => {
        const nameMatch = monster.name.toLowerCase().includes(searchText);
        const regionMatch = !selectedRegion || monster.region === selectedRegion;
        const typeMatch = !selectedType || monster.type === selectedType;
        
        return nameMatch && regionMatch && typeMatch;
    });
    
    // 重新显示筛选后的怪物（按区域分组）
    displayMonsters(filteredMonsters);
    
    // 如果有筛选条件，自动展开匹配的区域
    if (searchText || selectedRegion || selectedType) {
        autoExpandFilteredRegions(filteredMonsters);
    }
}


function autoExpandFilteredRegions(filteredMonsters) {
    // 收集有匹配怪物的区域
    const matchedRegions = new Set();
    filteredMonsters.forEach(monster => {
        matchedRegions.add(monster.region || '未知区域');
    });
    
    // 展开所有匹配的区域
    document.querySelectorAll('.region-section').forEach(section => {
        const header = section.querySelector('.region-header');
        const regionName = header.textContent.split(' (')[0]; // 移除数量部分
        
        if (matchedRegions.has(regionName)) {
            // 如果区域是折叠状态，展开它
            if (header.classList.contains('collapsed')) {
                toggleRegion(header);
            }
        } else {
            // 如果没有匹配的怪物，折叠该区域
            if (!header.classList.contains('collapsed')) {
                toggleRegion(header);
            }
        }
    });
}


// 从JSON文件加载数据
// 新的数据加载函数
async function loadMonstersData() {
  try {
    // 尝试从服务器加载
    const response = await fetch("monsters.json");
    if (response.ok) {
      const monsters = await response.json();
      initApp(monsters);
      return;
    }
  } catch (error) {
    console.log("从服务器加载失败，尝试本地加载...");
  }

  // 如果服务器加载失败，尝试本地文件
  try {
    // 使用XMLHttpRequest（对文件协议更友好）
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "monsters_data.json", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          // 0表示文件协议
          try {
            const monsters = JSON.parse(xhr.responseText);
            initApp(monsters);
          } catch (e) {
            showError("JSON解析失败: " + e.message);
          }
        } else {
          showError("无法加载怪物数据");
        }
      }
    };
    xhr.send();
  } catch (error) {
    showError("加载数据时出错: " + error.message);
  }
}

// 初始化应用
function initApp(monsters) {
  // 隐藏加载提示
  const loadingEl = document.getElementById("loading");
  if (loadingEl) loadingEl.style.display = "none";

  window.monstersData = monsters;

  // 收集所有区域和类型
  const allRegions = [...new Set(monsters.map((m) => m.region || "未知区域"))];
  const allTypes = [...new Set(monsters.map((m) => m.type || "未知类型"))];

  // 填充筛选下拉框
  const regionFilter = document.getElementById("region-filter");
  const typeFilter = document.getElementById("type-filter");

  if (regionFilter) {
    allRegions.forEach((region) => {
      regionFilter.innerHTML += `<option value="${region}">${region}</option>`;
    });
  }

  if (typeFilter) {
    allTypes.forEach((type) => {
      typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
    });
  }

  // 初始显示所有怪物
  displayMonsters(monsters);
}

// 错误提示
function showError(message) {
  const regionsDiv = document.getElementById("regions");
  if (regionsDiv) {
    regionsDiv.innerHTML = `
            <div style="color: #dc3545; padding: 20px; text-align: center;">
                <h3>数据加载失败</h3>
                <p>${message}</p>
                <p>请确保：</p>
                <ol style="text-align: left; display: inline-block;">
                    <li>monsters_data.json文件存在</li>
                    <li>通过本地服务器访问（如 http://localhost:3000/）</li>
                    <li>或使用支持文件协议的浏览器</li>
                </ol>
            </div>
        `;
  }
}

// 页面加载完成后调用
document.addEventListener("DOMContentLoaded", loadMonstersData);

// 显示怪物详情
function showDetails(name) {
  if (!window.monstersData) return;

  const monster = window.monstersData.find((m) => m.name === name);
  if (!monster) return;

  document.getElementById("modal-title").textContent = monster.name;

  // 构建紧凑的详情HTML
  // document.getElementById("modal-content").innerHTML = `
  //       <!-- 基本信息 -->
  //       <div class="detail-item basic">
  //           <span class="detail-label">类型</span>
  //           <span class="detail-value type-value">${
  //             monster.type || "未知"
  //           }</span>
  //       </div>
        
  //       <div class="detail-item basic">
  //           <span class="detail-label">区域</span>
  //           <span class="detail-value">${monster.region || "未知"}</span>
  //       </div>
        
  //       <div class="detail-item basic">
  //           <span class="detail-label">回合</span>
  //           <span class="detail-value">${monster.spawnRound || "未知"}</span>
  //       </div>
        
  //       <div class="detail-item basic">
  //           <span class="detail-label">体型</span>
  //           <span class="detail-value">${monster.size || "未知"}</span>
  //       </div>
        
  //       <!-- 战斗属性 -->
  //       <div class="detail-item combat">
  //           <span class="detail-label">生命值</span>
  //           <span class="detail-value hp-value">${monster.hp || "未知"}</span>
  //       </div>
        
  //       <div class="detail-item combat">
  //           <span class="detail-label">抗性</span>
  //           <span class="detail-value resistance-value">${
  //             monster.resistance || "未知"
  //           }</span>
  //       </div>
        
  //       <!-- 基础属性网格 -->
  //       <div class="detail-item stats">
  //           <span class="detail-label">属性</span>
  //           <div class="detail-value">
  //               <div class="stats-grid">
  //                   ${
  //                     monster.baseStats
  //                       ? monster.baseStats
  //                           .split(" ")
  //                           .map(
  //                             (stat) => `
  //                       <div class="stat-item">
  //                           <div class="stat-label">${
  //                             stat.split(/(?=[A-Z])/)[0] || stat
  //                           }</div>
  //                           <div class="stat-value">${
  //                             stat.replace(/[^0-9]/g, "") || "-"
  //                           }</div>
  //                       </div>
  //                   `
  //                           )
  //                           .join("")
  //                       : '<div class="stat-value">未知</div>'
  //                   }
  //               </div>
  //           </div>
  //       </div>
        
  //       <!-- 技能 -->
  //       ${
  //         monster.skills1 && monster.skills1 !== "无"
  //           ? `
  //       <div class="detail-item skills">
  //           <span class="detail-label">技能1</span>
  //           <div class="detail-value">
  //               <div class="skills-block">${monster.skills1}</div>
  //           </div>
  //       </div>
  //       `
  //           : ""
  //       }

  //       ${
  //         monster.skills2 && monster.skills2 !== "无"
  //           ? `
  //       <div class="detail-item skills">
  //           <span class="detail-label">技能2</span>
  //           <div class="detail-value">
  //               <div class="skills-block">${monster.skills2}</div>
  //           </div>
  //       </div>
  //       `
  //           : ""
  //       }

  //       ${
  //         monster.skills3 && monster.skills3 !== "无"
  //           ? `
  //       <div class="detail-item skills">
  //           <span class="detail-label">技能3</span>
  //           <div class="detail-value">
  //               <div class="skills-block">${monster.skills3}</div>
  //           </div>
  //       </div>
  //       `
  //           : ""
  //       }

  //       ${
  //         monster.skills4 && monster.skills4 !== "无"
  //           ? `
  //       <div class="detail-item skills">
  //           <span class="detail-label">技能4</span>
  //           <div class="detail-value">
  //               <div class="skills-block">${monster.skills4}</div>
  //           </div>
  //       </div>
  //       `
  //           : ""
  //       }
        
  //       <!-- 背景故事 -->
  //       ${
  //         monster.background && monster.background !== "无"
  //           ? `
  //       <div class="detail-item background">
  //           <span class="detail-label">背景</span>
  //           <div class="detail-value">
  //               <div class="background-block">${monster.background}</div>
  //           </div>
  //       </div>
  //       `
  //           : ""
  //       }
  //   `;

  document.getElementById("modal").style.display = "block";
  // 在 showDetails 函数末尾添加
  setTimeout(() => {
    const modalContent = document.querySelector(".modal-content");
    if (modalContent) {
      modalContent.scrollTop = 0; // 每次打开都滚动到顶部
    }
  }, 10);

  // 构建更丰富的详情HTML
  document.getElementById("modal-content").innerHTML = `
        <div class="detail-section">
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">类型</div>
                    <div class="stat-value">${monster.type || "未知"}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">区域</div>
                    <div class="stat-value">${monster.region || "未知"}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">出现回合</div>
                    <div class="stat-value">${
                      monster.spawnRound || "未知"
                    }</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">体型</div>
                    <div class="stat-value">${monster.size || "未知"}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="stat-item">
                <div class="stat-label">生命值</div>
                <div class="stat-value hp-value">${monster.hp || "未知"}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">基础属性</div>
                <div class="stat-value">${monster.baseStats || "未知"}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">抗性</div>
                <div class="stat-value resistance-value">${
                  monster.resistance || "未知"
                }</div>
            </div>
        </div>
        
        ${
          monster.skills[0] && monster.skills[0] !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">技能1</div>
            <div class="skills-box">
            技能名称：${monster.skills[0].名称}<br>
            技能类型：${monster.skills[0].类型}<br>
            技能精准：${monster.skills[0].精准}<br>
            技能暴击率：${monster.skills[0].暴击率}<br>
            技能伤害：${monster.skills[0].伤害}<br>
            技能特效：${monster.skills[0].特效}
            </div>
        </div>
        `
            : ""
        }

        ${
          monster.skills[1] && monster.skills[1] !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">技能2</div>
            <div class="skills-box">
            技能名称：${monster.skills[1].名称}<br>
            技能类型：${monster.skills[1].类型}<br>
            技能精准：${monster.skills[1].精准}<br>
            技能暴击率：${monster.skills[1].暴击率}<br>
            技能伤害：${monster.skills[1].伤害}<br>
            技能特效：${monster.skills[1].特效}
            </div>
        </div>
        `
            : ""
        }

        ${
          monster.skills[2] && monster.skills[2] !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">技能3</div>
            <div class="skills-box">
            技能名称：${monster.skills[2].名称}<br>
            技能类型：${monster.skills[2].类型}<br>
            技能精准：${monster.skills[2].精准}<br>
            技能暴击率：${monster.skills[2].暴击率}<br>
            技能伤害：${monster.skills[2].伤害}<br>
            技能特效：${monster.skills[2].特效}
            </div>
        </div>
        `
            : ""
        }

        ${
          monster.skills[3] && monster.skills[3] !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">技能4</div>
            <div class="skills-box">
            技能名称：${monster.skills[3].名称}<br>
            技能类型：${monster.skills[3].类型}<br>
            技能精准：${monster.skills[3].精准}<br>
            技能暴击率：${monster.skills[3].暴击率}<br>
            技能伤害：${monster.skills[3].伤害}<br>
            技能特效：${monster.skills[3].特效}
            </div>
        </div>
        `
            : ""
        }
        
        ${
          monster.background && monster.background !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">背景故事</div>
            <div class="background-box">${monster.background}</div>
        </div>
        `
            : ""
        }

        ${
          monster.behavior && monster.behavior !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">行为</div>
            <div class="background-box">${monster.behavior}</div>
        </div>
        `
            : ""
        }

        ${
          monster.counter && monster.counter !== "无"
            ? `
        <div class="detail-section">
            <div class="stat-label">对策</div>
            <div class="background-box">${monster.counter}</div>
        </div>
        `
            : ""
        }
    `;

  document.getElementById("modal").style.display = "block";
}

// 关闭模态框
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// 点击模态框外部关闭
window.onclick = function (event) {
  if (event.target.className === "modal") {
    closeModal();
  }
};
// 在脚本末尾添加
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});
