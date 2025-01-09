// script.js

document.addEventListener("DOMContentLoaded", () => {
  const levelForm = document.getElementById("level-form");
  const levelSelect = document.getElementById("level");
  const errorMessage = document.getElementById("error-message");

  const selectLevelSection = document.getElementById("select-level");
  const quizSection = document.getElementById("quiz-section");
  const wordElement = document.getElementById("word");
  const meaningElement = document.getElementById("meaning");
  const optionsContainer = document.getElementById("options");
  const quizForm = document.getElementById("quiz-form");
  const feedback = document.getElementById("feedback");

  const resultSection = document.getElementById("result-section");
  const restartButton = document.getElementById("restart-button");
  const nextButton = document.getElementById("next-button");
  const submitButton = document.getElementById("submit-button"); // 新增

  let testQueue = [];
  let wrongList = [];
  let currentWord = null;

  // 初始化等级选项
  function initializeLevels() {
    const levels = Array.from(new Set(words.map((word) => word.level))).sort();
    levels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = capitalizeFirstLetter(level);
      levelSelect.appendChild(option);
    });
  }

  // 处理等级选择表单提交
  levelForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const selectedLevel = levelSelect.value;
    if (!selectedLevel) {
      errorMessage.textContent = "请先选择一个等级。";
      return;
    }
    errorMessage.textContent = "";

    // 筛选出对应等级的词汇
    const selectedWords = words.filter((word) => word.level === selectedLevel);
    if (selectedWords.length === 0) {
      errorMessage.textContent = "没有找到对应的等级，请重新选择。";
      return;
    }

    // 初始化测试队列和错题本
    testQueue = shuffleArray([...selectedWords]);
    wrongList = [];

    // 隐藏选择等级界面，显示测试界面
    selectLevelSection.classList.add("hidden");
    quizSection.classList.remove("hidden");

    // 开始测试第一个单词
    loadNextWord();
  });

  // 加载下一个单词进行测试
  function loadNextWord() {
    if (testQueue.length === 0) {
      if (wrongList.length === 0) {
        // 测试完成
        quizSection.classList.add("hidden");
        resultSection.classList.remove("hidden");
        return;
      } else {
        // 重新测试错题本中的单词
        testQueue = shuffleArray([...wrongList]);
        wrongList = [];
      }
    }

    currentWord = testQueue.shift();
    displayWord(currentWord);
  }

  // 显示当前单词及选项
  function displayWord(wordObj) {
    wordElement.textContent = wordObj.word;
    // meaningElement.textContent = wordObj.meaning;
    meaningElement.textContent = 's ';

    // 生成选项：正确同义词 + 3 个干扰选项
    const correctSynonyms = wordObj.synonym;
    const distractors = getDistractors(wordObj.synonym, wordObj.word, 3);
    const allOptions = shuffleArray([...correctSynonyms, ...distractors]);

    // 清空之前的选项
    optionsContainer.innerHTML = "";

    // 生成复选框选项
    allOptions.forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.classList.add("option");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `option-${index}`;
      checkbox.name = "synonyms";
      checkbox.value = option;

      const label = document.createElement("label");
      label.htmlFor = `option-${index}`;
      label.textContent = option;

      optionDiv.appendChild(checkbox);
      optionDiv.appendChild(label);

      optionsContainer.appendChild(optionDiv);
    });

    // 清除之前的反馈
    feedback.textContent = "";
    feedback.classList.remove("correct", "incorrect", "show");

    // 隐藏“下一题”按钮
    nextButton.classList.add("hidden");

    // 恢复选项的颜色（如果之前有错误）
    const labels = optionsContainer.querySelectorAll("label");
    labels.forEach((label) => {
      label.classList.remove("correct-option");
    });

    // 显示“提交答案”按钮
    submitButton.classList.remove("hidden");
  }

  // 处理测试表单提交
  quizForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // 获取用户选择的选项
    const selectedOptions = Array.from(
      document.querySelectorAll('input[name="synonyms"]:checked')
    ).map((cb) => cb.value);

    if (selectedOptions.length === 0) {
      feedback.textContent = "请至少选择一个选项。";
      feedback.classList.add("incorrect", "show");
      return;
    }

    const currentWordText = wordElement.textContent;
    const currentWordObj = words.find((word) => word.word === currentWordText);

    if (!currentWordObj) {
      feedback.textContent = "发生错误，请重新开始测试。";
      feedback.classList.add("incorrect", "show");
      return;
    }

    const correctSynonyms = currentWordObj.synonym;

    // 判断用户选择是否完全正确
    const selectedSet = new Set(selectedOptions);
    const correctSet = new Set(correctSynonyms);

    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((item) => correctSet.has(item));

    if (isCorrect) {
      feedback.textContent = "正确！";
      feedback.classList.add("correct", "show");

      // 隐藏“提交答案”按钮
      submitButton.classList.add("hidden");

      // 直接跳转到下一题
      setTimeout(() => {
        feedback.classList.remove("show", "correct");
        feedback.textContent = "";
        loadNextWord();
      }, 300); // 300ms后加载下一题
    } else {
      feedback.textContent = `错误！正确的同义词是：${correctSynonyms.join(
        ", "
      )}`;
      feedback.classList.add("incorrect", "show");
      wrongList.push(currentWordObj);

      // 高亮显示正确选项
      highlightCorrectOptions(correctSynonyms);

      // 隐藏“提交答案”按钮
      submitButton.classList.add("hidden");

      // 显示“下一题”按钮
      nextButton.classList.remove("hidden");
    }
  });

  // 处理“下一题”按钮点击
  nextButton.addEventListener("click", () => {
    // 清除之前的反馈
    feedback.textContent = "";
    feedback.classList.remove("correct", "incorrect", "show");

    // 加载下一个单词
    loadNextWord();
  });

  // 处理重新开始按钮点击
  restartButton.addEventListener("click", () => {
    // 重置所有状态
    testQueue = [];
    wrongList = [];

    // 隐藏结果界面，显示选择等级界面
    resultSection.classList.add("hidden");
    selectLevelSection.classList.remove("hidden");
  });

  // 工具函数：打乱数组顺序（Fisher-Yates Shuffle）
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // 获取干扰选项
  function getDistractors(correctSynonyms, currentWord, count) {
    // 从所有词汇中排除当前单词和其正确同义词
    const potentialDistractors = words
      .filter((word) => word.word !== currentWord)
      .flatMap((word) => word.synonym)
      .filter((syn) => !correctSynonyms.includes(syn));

    // 去重
    const uniqueDistractors = Array.from(new Set(potentialDistractors));

    // 随机选择干扰选项
    return shuffleArray(uniqueDistractors).slice(0, count);
  }

  // 高亮显示正确选项
  function highlightCorrectOptions(correctSynonyms) {
    const labels = optionsContainer.querySelectorAll("label");
    labels.forEach((label) => {
      const input = label.previousElementSibling; // 复选框
      if (correctSynonyms.includes(input.value)) {
        label.classList.add("correct-option");
      }
    });
  }

  // 首字母大写
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // 初始化等级选项
  initializeLevels();
});
