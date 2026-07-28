const KEYWORD_TEMPLATES = [
  { keywords: ["成绩","分数","评分","评定","绩点"], templates: ["我的成绩是多少？","我的最终评分是什么？"] },
  { keywords: ["论文","毕业论文","毕业设计","答辩"], templates: ["我的毕业论文成绩是多少？","论文答辩通过了吗？"] },
  { keywords: ["押金","保证金","定金"], templates: ["我的押金是多少？","押金什么时候退还？"] },
  { keywords: ["租期","到期","截止","期限"], templates: ["租期什么时候结束？","什么时候到期？"] },
  { keywords: ["租房","租赁","房租","租金","房东"], templates: ["我的租房合同押金是多少？","每月租金是多少？"] },
  { keywords: ["合同","协议","条款"], templates: ["合同的主要内容是什么？","合同里约定了哪些条款？"] },
  { keywords: ["面试","笔试","招聘","应聘","offer","录用"], templates: ["我的面试是什么时候？","面试地点在哪里？"] },
  { keywords: ["医院","体检","检查","诊断","病历","报告"], templates: ["我的检查结果是什么？","上次体检是什么时候？"] },
  { keywords: ["电话","手机","联系方式"], templates: ["电话号码是多少？","怎么联系？"] },
  { keywords: ["地址","地点","位置","定位"], templates: ["地址在哪里？","具体位置在哪？"] },
  { keywords: ["金额","价格","费用","花费","消费"], templates: ["费用是多少？","总共花了多少钱？"] },
  { keywords: ["快递","物流","包裹","发货","收货"], templates: ["快递到哪里了？","什么时候能收到？"] },
  { keywords: ["时间","日期","安排","日程"], templates: ["是什么时间？","具体日期是哪天？"] },
  { keywords: ["账号","账户","用户名","密码"], templates: ["账号是什么？","登录信息是什么？"] },
  { keywords: ["车牌","车号","驾驶证","行驶证"], templates: ["车牌号是多少？","什么时候到期？"] },
  { keywords: ["课程","课表","上课","考试"], templates: ["什么时候考试？","上课时间是什么？"] },
  { keywords: ["工号","工资","薪资","奖金"], templates: ["我的工资是多少？","奖金发了吗？"] },
];

export function generateSuggestions(items, maxCount = 3) {
  if (!items || items.length === 0) return getDefaults();

  // Collect all text from recent items
  const texts = items.slice(0, 5).map((item) => {
    const source = [item.rawText, item.ocrText, item.content]
      .filter(Boolean)
      .join(" ");
    return source.toLowerCase();
  });

  const fullText = texts.join(" ");

  // Match keywords → collect question templates
  const matchedQuestions = [];
  for (const rule of KEYWORD_TEMPLATES) {
    const hit = rule.keywords.some((kw) => fullText.includes(kw.toLowerCase()));
    if (hit) {
      for (const t of rule.templates) {
        if (!matchedQuestions.includes(t)) {
          matchedQuestions.push(t);
        }
      }
    }
  }

  // Shuffle and slice
  const shuffled = matchedQuestions.sort(() => Math.random() - 0.5);
  const result = shuffled.slice(0, maxCount);

  return result.length > 0 ? result : getDefaults();
}

function getDefaults() {
  return [
    "我存了什么内容？",
    "最近有哪些重要信息？",
    "帮我找一下上次的记录",
  ];
}
