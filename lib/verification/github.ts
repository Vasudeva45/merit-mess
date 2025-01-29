import { Octokit } from "@octokit/rest";

export class GitHubVerification {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async verifyProfile(
    username: string,
    verificationCode: string
  ): Promise<{
    verified: boolean;
    score: number;
    details: any;
    error?: string;
  }> {
    try {
      // First verify the user exists and get basic profile info
      const [user, repos] = await Promise.all([
        this.octokit.users.getByUsername({ username }),
        this.octokit.repos.listForUser({ username }),
      ]);

      // Check if verification code exists in any of the verification methods
      const [bioVerified, repoVerified, gistVerified] = await Promise.all([
        this.checkBioVerification(username, verificationCode),
        this.checkRepoVerification(username, verificationCode),
        this.checkGistVerification(username, verificationCode),
      ]);

      // Verification is successful if any method contains the code
      const isVerified = bioVerified || repoVerified || gistVerified;

      if (!isVerified) {
        return {
          verified: false,
          score: 0,
          details: {
            error:
              "Verification code not found in GitHub profile, repositories, or gists",
            methods: {
              bio: bioVerified,
              repo: repoVerified,
              gist: gistVerified,
            },
          },
        };
      }

      // Calculate score and other metrics as before
      const contributions = await this.getContributions(username);
      const accountAge = this.calculateAccountAge(user.data.created_at);
      const score = this.calculateScore({
        accountAge,
        repos: repos.data.length,
        contributions,
        followers: user.data.followers,
      });

      return {
        verified: true,
        score,
        details: {
          accountAge,
          repositories: repos.data.length,
          contributions,
          followers: user.data.followers,
          verificationMethod: {
            bio: bioVerified,
            repo: repoVerified,
            gist: gistVerified,
          },
        },
      };
    } catch (error) {
      console.error("GitHub verification error:", error);
      return {
        verified: false,
        score: 0,
        details: {},
        error: (error as any).message || "Verification failed",
      };
    }
  }

  private async checkBioVerification(
    username: string,
    code: string
  ): Promise<boolean> {
    try {
      const { data: user } = await this.octokit.users.getByUsername({
        username,
      });
      return user.bio?.includes(code) || false;
    } catch {
      return false;
    }
  }

  private async checkRepoVerification(
    username: string,
    code: string
  ): Promise<boolean> {
    try {
      // Check for verification-repo
      const repoName = "verification-repo";

      // Try to get the repository
      const { data: repo } = await this.octokit.repos.get({
        owner: username,
        repo: repoName,
      });

      // Verify repository ownership
      if (repo.owner.login.toLowerCase() !== username.toLowerCase()) {
        return false;
      }

      // Get repository contents
      const { data: contents } = await this.octokit.repos.getContent({
        owner: username,
        repo: repoName,
        path: "",
      });

      // Check each file in the repository for the verification code
      if (Array.isArray(contents)) {
        for (const file of contents) {
          if (file.type === "file") {
            const { data: fileContent } = await this.octokit.repos.getContent({
              owner: username,
              repo: repoName,
              path: file.path,
            });

            // Check if file content contains verification code
            if ("content" in fileContent) {
              const content = Buffer.from(
                fileContent.content,
                "base64"
              ).toString();
              if (content.includes(code)) {
                return true;
              }
            }
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private async checkGistVerification(
    username: string,
    code: string
  ): Promise<boolean> {
    try {
      // List public gists for the user
      const { data: gists } = await this.octokit.gists.listForUser({
        username,
      });

      // Check each gist for the verification code
      for (const gist of gists) {
        if (gist.owner?.login.toLowerCase() !== username.toLowerCase()) {
          continue;
        }

        const { data: gistContent } = await this.octokit.gists.get({
          gist_id: gist.id,
        });

        // Check each file in the gist
        if (!gistContent.files) return false;
        for (const file of Object.values(gistContent.files)) {
          if (file && file.content?.includes(code)) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private calculateScore(metrics: any): number {
    let score = 0;

    // Age score (max 20) - 1 point per year up to 20
    score += Math.min(metrics.accountAge / 365, 20);

    // Repos score (max 25) - 5 points per repo up to 5
    score += Math.min(metrics.repos * 5, 25);

    // Contributions score (max 35)
    score += this.calculateContributionScore(metrics.contributions);

    // Followers score (max 20) - 2 points per follower up to 10
    score += Math.min(metrics.followers * 2, 20);

    return Math.round(score);
  }

  private calculateContributionScore(contributions: number): number {
    if (contributions > 500) return 35;
    if (contributions > 200) return 30;
    if (contributions > 100) return 25;
    if (contributions > 50) return 20;
    if (contributions > 20) return 15;
    return Math.min(contributions, 10);
  }

  private calculateAccountAge(createdAt: string): number {
    return Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  private async getContributions(username: string): Promise<number> {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              totalContributions
            }
          }
        }
      `;

      const response: { user: { contributionsCollection: { totalContributions: number } } } = await this.octokit.graphql(query, { username });
      return response?.user?.contributionsCollection?.totalContributions || 0;
    } catch (error) {
      console.error("Error fetching contributions:", error);
      return 0;
    }
  }
}
