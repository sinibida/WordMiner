"use client";

import { isAxiosError } from "axios";
import classNames from "classnames";
import _, { result } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WordDto } from "./dto";
import { dictHttp } from "./http";
import styles from "./page.module.css";
import { format } from "date-fns";

async function getWordInfo(word: string): Promise<WordDto | null> {
  try {
    return (await dictHttp.get(`entries/en/${word.toLowerCase()}`, {})).data[0];
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.status === 404) {
        return null;
      }
    }
    throw e;
  }
}

async function withLoading(
  setLoading: (x: boolean) => void,
  func: () => Promise<unknown>
) {
  setLoading(true);
  await func();
  setLoading(false);
}

function toCSV(objs: Record<string, string>[]): string {
  if (objs.length === 0) return "N/A";

  const keys = Object.keys(objs[0]);
  const data: string[][] = [];
  data.push(keys);
  objs.forEach((x) => data.push(keys.map((key) => x[key])));
  return data.map((row) => row.join("\t")).join("\n");
}

// https://github.com/Pseudo-Corp/SynergismOfficial/blob/5838bf12905fd55ba63ced9e86967d12db59d48d/src/ImportExport.ts#L214
function download(text: string, fileName: string) {
  const a = document.createElement("a");
  a.setAttribute("href", `data:text/plain;charset=utf-8,${text}`);
  a.setAttribute("download", fileName);
  a.setAttribute("id", "downloadSave");
  // "Starting in Firefox 75, the click() function works even when the element is not attached to a DOM tree."
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click
  // so let's have it work on older versions of Firefox, doesn't change functionality.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface Data {
  word: string;
  definition: string;
}
interface WordGroups {
  word: string;
  meanNum?: string;
  defNum?: string;
  add?: string;
  meaning?: string;
}
async function wordToData(wordCode: string): Promise<Data | null> {
  const matches =
    /^(?<word>[a-zA-Z ]+)(?<meanNum>\d+)?(?:_(?<defNum>\d+))?(\|(?<add>\+)?(?<meaning>.*))?$/.exec(
      wordCode
    );
  if (matches === null || matches.groups === undefined) return null;

  const { word, meanNum, defNum, add, meaning } =
    matches.groups as unknown as WordGroups;

  const pMeanNum = meanNum === undefined ? undefined : parseInt(meanNum);
  const pDefNum = defNum === undefined ? undefined : parseInt(defNum);

  if (meaning) {
    const meaningOrNA = meaning === "" ? "N/A" : meaning;
    if (add) {
      const data = await getWordInfo(word);
      if (data === null) return null;

      const def =
        data.meanings[pMeanNum ?? 0]?.definitions[pDefNum ?? 0]?.definition;
      return {
        word: word,
        definition: def === undefined ? meaningOrNA : meaningOrNA + " | " + def,
      };
    } else {
      return {
        word: word,
        definition: meaningOrNA,
      };
    }
  } else {
    const data = await getWordInfo(word);
    if (data) {
      return {
        word: word,
        definition:
          data.meanings[pMeanNum ?? 0]?.definitions[pDefNum ?? 0]?.definition ??
          "N/A",
      };
    } else {
      return null;
    }
  }

  return null;
}

const lastTextKey = "lastText";
const scrollFollowThreshould = 20;
export default function Home() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadedText = localStorage.getItem(lastTextKey);
    if (loadedText) {
      setText(loadedText);
      updateResponse(loadedText);
    }
  }, []);

  const tryFollowScroll = () => {
    setTimeout(() => {
      if (resultRef.current === null) return;
  
      const cur = resultRef.current;
  
      const curOffset = cur.scrollHeight - cur.scrollTop - cur.clientHeight;
      if (curOffset <= scrollFollowThreshould) {
        console.log(curOffset);
        cur.scrollTo({ top: cur.scrollHeight - cur.clientHeight});
      }
    })
  };

  const updateResponse = async (text: string) => {
    const responseObjs = (
      await Promise.all(
        text
          .split("\n")
          .filter((x) => !/^\s+$/.test(x))
          .map(wordToData)
      )
    ).filter((x) => x !== null);
    const newResponse = toCSV(
      responseObjs as unknown as Record<string, string>[]
    );
    setResponse(newResponse);

    tryFollowScroll();
  };

  const saveText = (text: string) => {
    localStorage.setItem(lastTextKey, text);
  };

  const debouncedOnChangeHandler = (text: string) => {
    withLoading(setLoading, async () => {
      await updateResponse(text);
      saveText(text);
    });
  };

  const debouncedOnChange = useMemo(
    () =>
      _.throttle(debouncedOnChangeHandler, 250, {
        trailing: true,
      }),
    []
  );

  const onChange = useCallback(
    (text: string) => {
      setText(text);

      debouncedOnChange(text);
    },
    [debouncedOnChange]
  );

  const onDownloadClick = () => {
    download(response, `words_${format(new Date(), "yyMMDDHHmmss")}.csv`);
  };

  const onResetClick = () => {
    localStorage.removeItem(lastTextKey);
  };

  const resultRef = useRef<HTMLPreElement>(null);

  return (
    <div className={classNames(styles.content, { [styles.stale]: loading })}>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className={styles.result}>
        <pre ref={resultRef}>{response}</pre>
      </div>
      <div>
        <button onClick={onDownloadClick}>Download</button>
        <br />
        <button onClick={onResetClick}>Reset</button>
      </div>
    </div>
  );
}
